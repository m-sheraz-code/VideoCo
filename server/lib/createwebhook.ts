import axios from 'axios';

export const createMondayWebhook = async () => {
  const mutation = `
    mutation {
      create_webhook(
        board_id: ${process.env.MONDAY_BOARD_ID},
        url: "${process.env.MONDAY_WEBHOOK_URL}",
        event: change_column_value
      ) {
        id
      }
    }
  `;

  try {
    const response = await axios.post(
      'https://api.monday.com/v2',
      { query: mutation },
      {
        headers: {
          Authorization: process.env.MONDAY_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('✅ Webhook registered:', response.data);
  } catch (err: any) {
    console.error('❌ Failed to register webhook:', err.response?.data || err.message);
  }
};

