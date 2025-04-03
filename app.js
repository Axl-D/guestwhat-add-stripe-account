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
    console.log("Starting data processing...");
    console.log("Received fields:", JSON.stringify(fields, null, 2));

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

    console.log("Processing organization data...");
    for (const field of fields) {
      if (orgKeyToVar.hasOwnProperty(field.key)) {
        console.log(`Mapping organization field: ${field.key} -> ${orgKeyToVar[field.key]} = ${field.value}`);
        orgData[orgKeyToVar[field.key]] = field.value;
      }
    }
    console.log("Organization data processed:", JSON.stringify(orgData, null, 2));

    console.log("Processing person data...");
    for (const field of fields) {
      if (personKeyToVar.hasOwnProperty(field.key)) {
        console.log(`Mapping person field: ${field.key} -> ${personKeyToVar[field.key]} = ${field.value}`);
        personData[personKeyToVar[field.key]] = field.value;
      }
    }
    console.log("Person data processed:", JSON.stringify(personData, null, 2));

    if (personData.dob) {
      console.log("Processing date of birth:", personData.dob);
      [personData.dobYear, personData.dobMonth, personData.dobDay] = personData.dob.split("-");
      console.log("Date of birth split into:", {
        year: personData.dobYear,
        month: personData.dobMonth,
        day: personData.dobDay,
      });
    } else {
      console.error("Date of Birth is missing or invalid");
      throw new Error("Date of Birth is missing or invalid.");
    }

    console.log("Data processing completed successfully");
    return { orgData, personData };
  } catch (error) {
    console.error("Error processing data:", error);
    return { error: "Error processing data" };
  }
}

async function makeStripeRequests(orgData, personData) {
  try {
    console.log("Starting Stripe account creation process...");
    console.log("Generating token with organization data:", JSON.stringify(orgData, null, 2));

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
    console.log("Token generated:", token.id ? "Success" : "Failed");

    if (token.id) {
      console.log("Creating custom account with token:", token.id);
      const stripeAccountData = await createCustomAccount(token.id, orgData.mcc, orgData.description, orgData.website);
      console.log("Custom account created:", stripeAccountData.id ? "Success" : "Failed");

      if (stripeAccountData.id) {
        console.log("Generating update token...");
        const updateToken = await generateUpdateToken();
        console.log("Update token generated:", updateToken.id ? "Success" : "Failed");

        console.log("Uploading ID document...");
        const documentData = await uploadIdDocument(personData.idFile[0].url);
        console.log("ID document uploaded:", documentData.id ? "Success" : "Failed");

        console.log("Adding person to account...");
        const stripePersonData = await addPersonToAccount(stripeAccountData.id, personData, documentData.id);
        console.log("Person added to account:", stripePersonData ? "Success" : "Failed");

        console.log("Updating account...");
        const updatedAccount = await updateAccount(stripeAccountData.id, orgData.name, updateToken.id);
        console.log("Account updated:", updatedAccount ? "Success" : "Failed");

        console.log("Adding bank account...");
        const bankAccount = await addBankAccount(stripeAccountData.id, orgData.iban, orgData.country);
        console.log("Bank account added:", bankAccount ? "Success" : "Failed");

        console.log("All Stripe steps completed successfully");
        return {
          success: true,
          accountId: stripeAccountData.id,
          message: "All steps completed successfully.",
        };
      }
    }
  } catch (error) {
    console.error("Error in Stripe requests:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
    });
  }
}

async function makeBubbleRequests(isTest, orgData, accountId) {
  console.log("Starting Bubble.io integration...");
  console.log("Test mode:", isTest);
  console.log("Account ID:", accountId);
  console.log("Organization data:", JSON.stringify(orgData, null, 2));

  return await createNonProfit(isTest, orgData, accountId);
}

import express from "express";
const app = express();
const port = 3000;

// Middleware to parse JSON data
app.use(express.json());

// Endpoint to receive data from Postman
app.post("/submit-to-stripe", async (req, res) => {
  console.log("Received request at /submit-to-stripe");
  console.log("Request body:", JSON.stringify(req.body, null, 2));

  const submission = req.body; // Access data sent from Postman

  const { orgData, personData } = await processData(submission.data.fields);
  console.log("Processed data:", { orgData, personData });

  const result = await makeStripeRequests(orgData, personData);
  console.log("Stripe request result:", result);

  if (result.success) {
    res.status(200).json({ message: result.message, accountId: result.accountId });
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.post("/submit-to-bubble/:accountId", async (req, res) => {
  console.log("Received request at /submit-to-bubble");
  console.log("Request params:", req.params);
  console.log("Request query:", req.query);
  console.log("Request body:", JSON.stringify(req.body, null, 2));

  const submission = req.body; // Access data sent from Postman
  const accountId = req.params.accountId; // Access accountId from URL
  const isTest = req.query.isTest == "true" ? true : false;

  const { orgData } = await processData(submission.data.fields);
  console.log("Processed organization data:", orgData);

  const result = await makeBubbleRequests(isTest, orgData, accountId);
  console.log("Bubble request result:", result);

  res.status(result.status).json(result);
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
