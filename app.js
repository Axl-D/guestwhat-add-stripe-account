import {
  generateToken,
  createCustomAccount,
  addPersonToAccount,
  generateUpdateToken,
  updateAccount,
  addBankAccount,
  uploadIdDocument,
} from "./stripeRequests.js";

import { createNonProfit } from "./bubbleRequests.js";

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
      // bubble only
      question_q5GPpG: "logo",
      question_5Xx8yZ: "tagline",
      question_9NZlaQ: "projectPicture",
      question_dbdK5d: "projectPictureCredits",
      question_YjapLW: "projectTagline",
      question_DqzAlN: "donationPurpose",
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

    if (personData.dob) {
      [personData.dobYear, personData.dobMonth, personData.dobDay] = personData.dob.split("-");
    } else {
      throw new Error("Date of Birth is missing or invalid.");
    }

    return { orgData, personData };
  } catch (error) {
    console.error("Error processing data:", error);
    return { error: "Error processing data" };
  }
}
async function makeStripeRequests(orgData, personData) {
  try {
    const token = await generateToken(
      orgData.name,
      orgData.type,
      orgData.country,
      orgData.city,
      orgData.postal_code,
      orgData.address_street,
      orgData.siret,
      orgData.phone,
      orgData.vat_id
    );
    if (token.id) {
      const stripeAccountData = await createCustomAccount(token.id, orgData.mcc, orgData.description, orgData.website);
      if (stripeAccountData.id) {
        const updateToken = await generateUpdateToken();
        const documentData = await uploadIdDocument(personData.idFile[0].url);
        const stripePersonData = await addPersonToAccount(stripeAccountData.id, personData, documentData.id);
        const updatedAccount = await updateAccount(stripeAccountData.id, orgData.name, updateToken.id);
        const bankAccount = await addBankAccount(stripeAccountData.id, orgData.iban, orgData.country);
        return {
          success: true,
          accountId: stripeAccountData.id,
          message: "All steps completed successfully.",
        };
      }
    }
  } catch (error) {
    console.error("Error processing requests:", error);
  }
}

async function makeBubbleRequests(isTest, orgData, accountId) {
  return await createNonProfit(isTest, orgData, accountId);
}

import express from "express";
const app = express();
const port = 3000;

// Middleware to parse JSON data
app.use(express.json());

// Endpoint to receive data from Postman
app.post("/submit-to-stripe", async (req, res) => {
  const submission = req.body; // Access data sent from Postman

  const { orgData, personData } = await processData(submission.data.fields);
  // res.status(200).json({ orgData: orgData, personData: personData });

  const result = await makeStripeRequests(orgData, personData);

  if (result.success) {
    res.status(200).json({ message: result.message, accountId: result.accountId });
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.post("/submit-to-bubble/:accountId", async (req, res) => {
  const submission = req.body; // Access data sent from Postman
  const accountId = req.params.accountId; // Access accountId from URL
  const isTest = req.query.isTest == "true" ? true : false;

  const { orgData } = await processData(submission.data.fields);
  // res.status(200).json({ orgData: orgData, personData: personData });

  const result = await makeBubbleRequests(isTest, orgData, accountId);

  res.status(result.status).json(result);
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
