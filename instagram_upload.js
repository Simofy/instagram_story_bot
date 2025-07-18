import dotenv from "dotenv";

dotenv.config();

const { ACCESS_TOKEN, INSTAGRAM_APP_ID, DOMAIN_NAME } = process.env;

async function handleUpload(image, generateImage) {
  const today = new Date().getDay();
  console.log(
    `handleUpload for ${image} start for day ${today}: ` + new Date()
  );
  const outputImageFilename = `${image}_${today}.png`;

  const publicImageUrl = `${DOMAIN_NAME}/${outputImageFilename}`;

  console.group(`Instagram Upload Process for ${image}`);

  try {
    await generateImage(outputImageFilename);
    console.log(
      `Image ${outputImageFilename} generated/overwritten successfully.`
    );

    console.log("Attempting to post image to Instagram: " + publicImageUrl);

    const responseStoryPost = await fetch(
      `https://graph.instagram.com/v21.0/${INSTAGRAM_APP_ID}/media?image_url=${encodeURIComponent(
        publicImageUrl
      )}&media_type=STORIES&access_token=${ACCESS_TOKEN}`,
      {
        method: "post",
      }
    );

    const responseJson = await responseStoryPost.json();
    if (!responseStoryPost.ok || responseJson.error) {
      console.error(
        "Error creating media container:",
        responseJson.error || responseJson
      );
      throw new Error(
        `Error creating media container: ${
          responseJson.error
            ? responseJson.error.message
            : responseStoryPost.statusText
        }`
      );
    }

    const { id: mediaId } = responseJson;
    if (!mediaId) {
      console.error(
        "No mediaId received from Instagram media creation:",
        responseJson
      );
      throw new Error("Media ID not found in Instagram response");
    }
    console.log(`Instagram Media container created with ID: ${mediaId}`);

    async function waitForResponseStatus() {
      console.log(`Polling status for media ID: ${mediaId}`);
      const responseStoryStatus = await fetch(
        `https://graph.instagram.com/v21.0/${mediaId}?fields=status_code&access_token=${ACCESS_TOKEN}`,
        {
          method: "get",
        }
      );

      const statusJson = await responseStoryStatus.json();
      if (!responseStoryStatus.ok || statusJson.error) {
        console.error(
          "Error fetching media status:",
          statusJson.error || statusJson
        );

        throw new Error(
          `Error fetching media status: ${
            statusJson.error
              ? statusJson.error.message
              : responseStoryStatus.statusText
          }`
        );
      }

      const { status_code } = statusJson;
      console.log(`Media ${mediaId} status: ${status_code}`);

      if (status_code === "IN_PROGRESS" || status_code === "UPLOADING") {
        setTimeout(waitForResponseStatus, 10000);
        return;
      }

      if (status_code === "FINISHED") {
        console.log(
          `Media ${mediaId} processing finished. Attempting to publish.`
        );
        const publishResponse = await fetch(
          `https://graph.instagram.com/v21.0/${INSTAGRAM_APP_ID}/media_publish?creation_id=${mediaId}&access_token=${ACCESS_TOKEN}`,
          {
            method: "post",
          }
        );
        const publishJson = await publishResponse.json();
        if (!publishResponse.ok || publishJson.error) {
          console.error(
            "Error publishing media:",
            publishJson.error || publishJson
          );
          throw new Error(
            `Error publishing media: ${
              publishJson.error
                ? publishJson.error.message
                : publishResponse.statusText
            }`
          );
        }

        console.log("Instagram Story Upload success!", publishJson);
        return; // Successfully published
      }

      if (status_code === "ERROR" || status_code === "EXPIRED") {
        console.error(
          `Media processing failed or expired for ${mediaId} with status: ${status_code}`,
          statusJson
        );
        throw new Error(
          `Media processing failed or expired for ${mediaId}: ${status_code}`
        );
      }

      console.warn(
        `Unexpected media status for ${mediaId}: ${status_code}. Halting polling for this attempt.`,
        statusJson
      );
      throw new Error(`Unexpected media status for ${mediaId}: ${status_code}`);
    }

    setTimeout(waitForResponseStatus, 10000);
  } catch (error) {
    console.error(
      "An error occurred during the handleUpluad process:",
      error.message
    );
  }
  console.groupEnd();
}

export {
  handleUpload,
};
