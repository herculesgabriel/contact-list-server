const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function validate(data) {
  const empty = 0;
  const phoneMinimumLength = 10;
  const phoneMaximumLength = 13;
  const emailPattern = /.+@.+\.com/;

  if (data.firstName.length === empty)
    return { valid: false, error: 'Preencha o campo "Nome"' };
  if (data.lastName.length === empty)
    return { valid: false, error: 'Preencha o campo "Sobrenome"' };
  if (data.phone.length < phoneMinimumLength)
    return { valid: false, error: 'O campo "Telefone" precisa de ao menos 10 dígitos' };
  if (data.phone.length > phoneMaximumLength)
    return { valid: false, error: 'O campo "Telefone" não aceita mais que 13 dígitos' };
  if (!emailPattern.test(data.email))
    return { valid: false, error: 'Informe um email válido' };

  return { valid: true };
}

app.get('/get-data', (req, res) => {
  db.all('SELECT * FROM contacts', (error, rows) => {
    const empty = 0;

    if (error) return res.send({ status: 'error', error: 'Erro ao consultar dados' });

    if (rows.length === empty) return res.send({
      status: 'error',
      error: 'Não existem dados cadastrados',
    });

    return res.send({ status: 'OK', rows });
  });
});

app.post('/save-data', (req, res) => {
  const { valid, error } = validate(req.body);

  if (!valid) return res.send({
    status: 'error',
    error,
  });

  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name VARCHAR(20),
        last_name VARCHAR(20),
        phone VARCHAR(13),
        email VARCHAR(20)
      );
      `, (error) => {
      if (error) {
        return res.send({
          status: 'error',
          error: 'Erro ao criar banco de dados',
        });
      };
    });

    const query = `
      INSERT INTO contacts (
        first_name,
        last_name,
        phone,
        email
      ) VALUES (?,?,?,?);
    `;

    const { firstName, lastName, phone, email } = req.body;

    const values = [
      firstName,
      lastName,
      phone,
      email,
    ];

    db.run(query, values, (error) => {
      if (error) return res.send({
        status: 'error',
        error: 'Erro ao cadastrar contato',
      });

      return res.send({ status: 'OK' });
    });
  });
});

app.post('/delete-contact/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM contacts WHERE id = ?', [id], (error) => {
    if (error) return res.send({ status: 'error', error });

    return res.send({ status: 'OK' });
  });
});

app.post('/edit-contact/', (req, res) => {
  const { valid, error } = validate(req.body);

  if (!valid) return res.send({ status: 'error', error });

  const query = `
    UPDATE contacts SET
      first_name = ?,
      last_name = ?,
      phone = ?,
      email = ?
    WHERE id = ?;
  `;

  const { firstName, lastName, phone, email, id } = req.body;

  const values = [
    firstName,
    lastName,
    phone,
    email,
    id,
  ];

  db.run(query, values, (error) => {
    if (error) return res.send({ status: 'error', error: 'Erro ao editar contato' });

    return res.send({ status: 'OK' });
  });
});

app.listen(port, () => console.log(`Server started at localhost: ${port}`));
