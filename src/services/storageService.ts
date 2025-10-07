import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/config';

/**
 * Downloads an image from a URL and uploads it to Firebase Storage
 * @param imageUrl - The URL of the image to download (e.g., Google profile picture)
 * @param userId - The user's ID to create a unique path
 * @returns The Firebase Storage download URL or null if failed
 */
export async function uploadProfilePictureFromUrl(
  imageUrl: string,
  userId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    console.log('📥 Downloading profile picture from URL...');

    // Fetch the image with no-cors mode as fallback
    let response;
    try {
      response = await fetch(imageUrl);
    } catch {
      console.warn('⚠️ CORS fetch failed, trying no-cors mode...');
      response = await fetch(imageUrl, { mode: 'no-cors' });
    }

    if (!response.ok && response.type !== 'opaque') {
      throw new Error('Failed to download image');
    }

    const blob = await response.blob();
    console.log('✅ Image downloaded, size:', (blob.size / 1024).toFixed(2), 'KB');

    // Create a reference to Firebase Storage
    const storageRef = ref(storage, `profile-pictures/${userId}.jpg`);

    // Upload the image
    console.log('📤 Uploading to Firebase Storage...');
    await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
      cacheControl: 'public, max-age=31536000', // Cache for 1 year
    });

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    console.log('✅ Profile picture uploaded successfully');

    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('❌ Error uploading profile picture:', error);
    // Return error details for better debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Uploads a user-selected file to Firebase Storage as the profile picture
 */
export async function uploadProfilePictureFile(
  file: File,
  userId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const storageRef = ref(storage, `profile-pictures/${userId}.jpg`);

    await uploadBytes(storageRef, file, {
      contentType: file.type || 'image/jpeg',
      cacheControl: 'public, max-age=31536000',
    });

    const downloadURL = await getDownloadURL(storageRef);
    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('❌ Error uploading profile picture file:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Deletes a user's profile picture from Firebase Storage
 * @param userId - The user's ID
 */
export async function deleteProfilePicture(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const storageRef = ref(storage, `profile-pictures/${userId}.jpg`);
    await deleteObject(storageRef);
    console.log('✅ Profile picture deleted');
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting profile picture:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
