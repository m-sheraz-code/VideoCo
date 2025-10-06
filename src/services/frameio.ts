interface FrameIOConfig {
  apiToken: string;
  baseUrl: string;
}

interface FrameIOAsset {
  id: string;
  name: string;
  type: string;
  filesize: number;
  downloadUrl?: string;
  embedUrl?: string;
}

class FrameIOService {
  private config: FrameIOConfig;

  constructor() {
    this.config = {
      apiToken: import.meta.env.VITE_FRAMEIO_API_TOKEN || '',
      baseUrl: 'https://api.frame.io/v2',
    };
  }

  async getAsset(assetId: string): Promise<FrameIOAsset | null> {
    if (!this.config.apiToken) {
      console.warn('Frame.io API token not configured');
      return null;
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/assets/${assetId}`, {
        headers: {
          Authorization: `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Frame.io API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching Frame.io asset:', error);
      return null;
    }
  }

  async uploadAsset(
    projectId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<string | null> {
    if (!this.config.apiToken) {
      console.warn('Frame.io API token not configured');
      return null;
    }

    try {
      const createResponse = await fetch(`${this.config.baseUrl}/assets`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: file.name,
          type: 'file',
          filetype: file.type,
          filesize: file.size,
          parent_id: projectId,
        }),
      });

      if (!createResponse.ok) {
        throw new Error(`Failed to create asset: ${createResponse.statusText}`);
      }

      const assetData = await createResponse.json();

      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch(assetData.upload_urls.url, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.statusText}`);
      }

      return assetData.id;
    } catch (error) {
      console.error('Error uploading to Frame.io:', error);
      return null;
    }
  }

  getEmbedUrl(assetId: string): string {
    return `https://app.frame.io/player/${assetId}`;
  }
}

export const frameIOService = new FrameIOService();
