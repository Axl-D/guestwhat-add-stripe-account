import axios from "axios";
import dotenv from "dotenv";
dotenv.config();
process.env.STRIPE_SECRET_KEY;

export async function createNonProfit(isTestVersion, orgData, stripeAccountId) {
  const formdata = new URLSearchParams();
  formdata.append("stripe_account_id", stripeAccountId);
  formdata.append("name", orgData.name);
  formdata.append("project_description_list", JSON.stringify([orgData.description, ""]));
  formdata.append("donation_purpose_list", JSON.stringify([orgData.donationPurpose, ""]));
  formdata.append("project_tagline_list", JSON.stringify([orgData.projectTagline], ""));
  formdata.append("project_picture_credits", orgData.projectPictureCredits || "");
  formdata.append("logo", orgData.logo[0]?.url || ""); // Empty if no logo
  formdata.append("project_picture", orgData.projectPicture[0]?.url || ""); // Empty if no picture
  formdata.append("tagline_list", JSON.stringify([orgData.tagline, ""])); // Convert array to JSON string

  //   console.log(JSON.stringify([orgData.tagline, ""]));

  try {
    const response = await axios.post(
      //   `https://guestwhat.co/${isTestVersion ? "version-test/" : ""}api/1.1/wf/new-tally-submission`,
      `https://guestwhat.co/${isTestVersion ? "version-test/" : ""}api/1.1/obj/Non-Profit/`,
      formdata,
      {
        headers: {
          Authorization: `Bearer ${isTestVersion ? process.env.BUBBLE_TEST_KEY : process.env.BUBBLE_LIVE_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded", // URL-encoded form data
        },
      }
    );

    return {
      status: response.status,
      statusText: response.statusText,
      version: isTestVersion ? "TEST" : "LIVE",
      recordId: response.data.id,
      recordName: orgData.name,
    };
  } catch (error) {
    console.error("Error:", error);
  }
}
