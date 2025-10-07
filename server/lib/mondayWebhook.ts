import axios from 'axios';

export const createMondayWebhook = async () => {
  const mondayApiKey = process.env.MONDAY_API_KEY;
  const boardId = parseInt(process.env.MONDAY_BOARD_ID!);
  const webhookUrl = process.env.MONDAY_WEBHOOK_URL!;

  if (!mondayApiKey || !boardId || !webhookUrl) {
    console.error('❌ Missing Monday API config');
    return null;
  }

  const mutation = `
    mutation CreateWebhook($boardId: Int!, $url: String!, $event: WebhookEventType!) {
      create_webhook(board_id: $boardId, url: $url, event: $event) {
        id
      }
    }
  `;

  const variables = {
    boardId,
    url: webhookUrl,
    event: 'change_column_value',
  };

  try {
    const resp = await axios.post(
      'https://api.monday.com/v2',
      { query: mutation, variables },
      {
        headers: {
          Authorization: mondayApiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (resp.data.errors) {
      console.error('❌ Monday API Error:', resp.data.errors);
      return null;
    }

    const webhookId = resp.data.data.create_webhook.id;
    console.log('✅ Monday webhook created successfully:', webhookId);
    return webhookId;
  } catch (err: any) {
    console.error('❌ Failed to create Monday webhook:', err.response?.data || err.message);
    return null;
  }
};
