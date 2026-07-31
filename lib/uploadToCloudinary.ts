// lib/uploadToCloudinary.ts
const CLOUD_NAME = 'vsmptuug';
const UPLOAD_PRESET = 'tofu_profile_pics';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export async function uploadToCloudinary(imageUri: string): Promise<string> {
  const formData = new FormData();
  
  // Create a file object for React Native
  // The type can be generic image/jpeg if not known, Cloudinary is smart enough
  const fileName = imageUri.split('/').pop() || 'profile.jpg';
  const type = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg';
  
  formData.append('file', {
    uri: imageUri,
    type,
    name: fileName,
  } as any);
  
  formData.append('upload_preset', UPLOAD_PRESET);

  try {
    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Cloudinary upload error:', errorData);
      throw new Error(errorData.error?.message || 'Failed to upload image');
    }

    const data = await response.json();
    return data.secure_url; // Returns the HTTPS URL of the uploaded image
  } catch (error: any) {
    console.error('uploadToCloudinary failed:', error);
    throw new Error(error.message || 'Image upload failed');
  }
}
