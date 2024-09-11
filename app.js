import { generateToken, createCustomAccount, addPersonToAccount, generateUpdateToken, updateAccount, addBankAccount, uploadIdDocument } from "./stripeRequests.js";

async function processData(fields) {
  try {
    const orgKeyToVar = {
      question_ja2KXR: "name",
      question_2E52zp: "address_street",
      question_xXBGEG: "city",
      question_ZjyxX0: "postal_code",
      question_QKyGpg: "siret",
      question_A75kYB: "phone",
      question_9q5eYG: "vat_id",
      question_QoR0X7: "description",
      question_Qo7eZX: "website",
      question_9N79k5: "iban",
    };
    const personKeyToVar = {
      question_eqPbGq: "first_name",
      question_WOd46J: "last_name",
      question_2E52zp: "address_street",
      question_xXBGEG: "city",
      question_ZjyxX0: "postal_code",
      question_A75kYB: "phone",
      question_aQoW19: "dob",
      question_b5GaMe: "email",
      question_685qYe: "idFile",
    };
    // prepare objects with default values, mcc 8398 is the code for charity & non-profits orgs
    const orgData = { type: "non_profit", mcc: "8398", country: "FR" };
    const personData = { title: "Directeur", country: "FR" };

    for (const field of fields) {
      if (orgKeyToVar.hasOwnProperty(field.key)) orgData[orgKeyToVar[field.key]] = field.value;
      if (personKeyToVar.hasOwnProperty(field.key)) personData[personKeyToVar[field.key]] = field.value;
    }

    [personData.dobYear, personData.dobMonth, personData.dobDay] = personData.dob.split("-");

    // console.log("orgData", orgData, "personData", personData);

    try {
      const token = await generateToken(orgData.name, orgData.type, orgData.country, orgData.city, orgData.postal_code, orgData.address_street, orgData.siret, orgData.phone, orgData.vat_id);
      if (token.id) {
        const stripeAccountData = await createCustomAccount(token.id, orgData.mcc, orgData.description, orgData.website);
        if (stripeAccountData.id) {
          const updateToken = await generateUpdateToken();
          const documentData = await uploadIdDocument(personData.idFile[0].url);
          const stripePersonData = await addPersonToAccount(stripeAccountData.id, personData, documentData.id);
          const updatedAccount = await updateAccount(stripeAccountData.id, updateToken.id);
          const bankAccount = await addBankAccount(stripeAccountData.id, orgData.iban, orgData.country);
        }
      }
    } catch (error) {
      console.error("Error processing requests:", error);
    }

    // console.log("Data processed successfully");
  } catch (error) {
    console.error("Error processing data:", error);
  }
}

import express from 'express';
const app = express();
const port = 3000; // Choose your desired port

// Middleware to parse JSON data
app.use(express.json());

// Endpoint to receive data from Postman
app.post('/submit', (req, res) => {
  const submission = req.body; // Access data sent from Postman
  // console.log('Received submission:', JSON.stringify(submission.data.fields));
  // res.send('Data received successfully!');
    processData(submission.data.fields);
})

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
})
