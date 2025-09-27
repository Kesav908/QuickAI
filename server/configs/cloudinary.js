import {v2 as cloudinary} from 'cloudinary';

const connectCloudinary = async () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        // Add webhook configuration if you're using webhooks
        secure: true
    });
    
    console.log('Cloudinary connected successfully');
};

// Helper function to verify webhook signatures (only if using webhooks)
export const verifyWebhookSignature = (body, signature, timestamp) => {
    const webhookSecret = process.env.CLOUDINARY_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
        console.log('No webhook secret configured - skipping webhook verification');
        return true; // Return true if not using webhooks
    }
    
    try {
        return cloudinary.utils.verifyNotificationSignature(
            body,
            timestamp,
            signature,
            webhookSecret
        );
    } catch (error) {
        console.error('Webhook signature verification failed:', error);
        return false;
    }
};

export default connectCloudinary;
