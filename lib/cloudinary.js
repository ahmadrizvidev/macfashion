import axios from "axios";

export const uploadToCloudinary = async (file, folder = "dashboard") => {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", "dashboard_unsigned"); // Get from Cloudinary
  data.append("folder", folder);

  const res = await axios.post(
    "https://api.cloudinary.com/v1_1/dyglbihnl/upload",
    data
  );

  return res.data.secure_url;
};
