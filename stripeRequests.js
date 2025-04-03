import fetch from "node-fetch";
import dotenv from "dotenv";
if (!process.env.GITHUB_ACTIONS) {
  dotenv.config();
}

// Function to generate a token
export async function generateToken(
  name,
  business_type,
  country,
  city,
  postal_code,
  address_street,
  siret,
  phone,
  vat_id
) {
  console.log("Generating Stripe token for organization:", {
    name,
    business_type,
    country,
    city,
    postal_code,
    address_street,
    siret,
    phone,
    vat_id,
  });

  const response = await fetch("https://api.stripe.com/v1/tokens", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_PUBLIC_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      "account[company][name]": name,
      "account[tos_shown_and_accepted]": "true",
      "account[business_type]": business_type,
      "account[company][address][country]": country,
      "account[company][address][city]": city,
      "account[company][address][postal_code]": postal_code,
      "account[company][address][line1]": address_street,
      "account[company][phone]": phone,
      "account[company][tax_id]": siret,
      "account[company][vat_id]": vat_id,
    }),
  });

  const tokenData = await response.json();
  if (tokenData.error) {
    console.error("Token generation failed:", tokenData.error);
    throw new Error("Stripe generateToken error");
  }
  console.log("Token generated successfully:", tokenData.id);
  return tokenData;
}

// Function to create a custom account
export async function createCustomAccount(tokenId, mcc, description, website) {
  console.log("Creating Stripe custom account with:", {
    tokenId,
    mcc,
    description,
    website,
  });

  const response = await fetch("https://api.stripe.com/v1/accounts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      account_token: tokenId,
      type: "custom",
      country: "FR",
      "capabilities[card_payments][requested]": "true",
      "capabilities[transfers][requested]": "true",
      "business_profile[mcc]": mcc,
      "business_profile[product_description]": description,
      "business_profile[url]": website,
      "settings[payouts][schedule][interval]": "manual",
    }),
  });

  const accountData = await response.json();

  if (accountData.error) {
    console.error("Account creation failed:", accountData.error);
    throw new Error("Stripe createCustomAccount error");
  }
  console.log(`Custom account created successfully: ${accountData.id}`);
  console.log("Account details:", {
    type: accountData.type,
    country: accountData.country,
    capabilities: accountData.capabilities,
    business_profile: accountData.business_profile,
    payouts_enabled: accountData.payouts_enabled,
    payouts_schedule: accountData.settings?.payouts?.schedule,
  });
  return accountData;
}

export async function addPersonToAccount(accountId, person, fileId) {
  console.log("Adding person to account:", {
    accountId,
    person: {
      first_name: person.first_name,
      last_name: person.last_name,
      title: person.title,
      email: person.email,
      phone: person.phone,
      dob: `${person.dobYear}-${person.dobMonth}-${person.dobDay}`,
      city: person.city,
      postal_code: person.postal_code,
      address_street: person.address_street,
    },
    fileId,
  });

  const response = await fetch(`https://api.stripe.com/v1/accounts/${accountId}/persons`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      first_name: person.first_name,
      last_name: person.last_name,
      "relationship[representative]": "true",
      "relationship[executive]": "true",
      "relationship[director]": "true",
      "relationship[title]": person.title,
      email: person.email,
      phone: person.phone,
      "dob[day]": person.dobDay,
      "dob[month]": person.dobMonth,
      "dob[year]": person.dobYear,
      "address[city]": person.city,
      "address[postal_code]": person.postal_code,
      "address[line1]": person.address_street,
      "verification[document][front]": fileId,
    }),
  });
  const personData = await response.json();

  if (personData.error) {
    console.error("Person addition failed:", personData.error);
    throw new Error("Stripe addPersonToAccount error");
  }
  console.log("Person added successfully:", personData.id);
  return personData;
}

//Create new token to update Account and specify that all persons have been added.
export async function generateUpdateToken() {
  console.log("Generating update token for account verification");

  const response = await fetch("https://api.stripe.com/v1/tokens", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_PUBLIC_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      "account[company][directors_provided]": "true",
      "account[company][executives_provided]": "true",
      "account[company][owners_provided]": "true",
    }),
  });

  const tokenData = await response.json();
  if (tokenData.error) {
    console.error("Update token generation failed:", tokenData.error);
    throw new Error("Stripe generateUpdateToken error");
  }
  console.log("Update token generated successfully:", tokenData.id);
  return tokenData;
}

export async function updateAccount(accountId, name, tokenId) {
  console.log("Updating account:", {
    accountId,
    name,
    tokenId,
  });

  try {
    const response = await fetch(`https://api.stripe.com/v1/accounts/${accountId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        account_token: tokenId,
        "settings[payments][statement_descriptor]": name,
      }),
    });

    const accountData = await response.json();
    console.log("Account updated successfully:", accountData.id);
    return accountData;
  } catch (error) {
    console.error("Error updating account:", error);
    throw new Error("Could not update custom account");
  }
}

//Add a bank account to the account
export async function addBankAccount(accountId, iban, country) {
  console.log("Adding bank account:", {
    accountId,
    iban,
    country,
  });

  const response = await fetch(`https://api.stripe.com/v1/accounts/${accountId}/external_accounts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      "external_account[object]": "bank_account",
      "external_account[country]": country,
      "external_account[currency]": "EUR",
      "external_account[account_number]": iban,
    }),
  });

  const bankAccountData = await response.json();
  if (bankAccountData.error) {
    console.error("Bank account addition failed:", bankAccountData.error);
    throw new Error("Stripe addBankAccount error");
  }
  console.log("Bank account added successfully:", bankAccountData.id);
  return bankAccountData;
}

export async function uploadIdDocument(url) {
  console.log("Uploading ID document from URL:", url);

  const fetchResponse = await fetch(url);
  const fileBuffer = await fetchResponse.arrayBuffer();
  const blob = new Blob([fileBuffer], { type: "application/octet-stream" });

  const formData = new FormData();
  formData.append("file", blob);
  formData.append("purpose", "identity_document");

  const stripeResponse = await fetch(`https://files.stripe.com/v1/files`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
    },
    body: formData,
  });

  const fileData = await stripeResponse.json();
  if (fileData.error) {
    console.error("ID document upload failed:", fileData.error);
    throw new Error("Stripe uploadIdDocument error");
  }
  console.log("ID document uploaded successfully:", fileData.id);
  return fileData;
}
