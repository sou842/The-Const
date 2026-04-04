import type { BlockTool, BlockToolData, BlockToolConstructorOptions, API } from '@editorjs/editorjs';

interface CustomYouTubeEmbedData extends BlockToolData {
  url: string;
}

class CustomYouTubeEmbed implements BlockTool {
  private api: API;
  private data: CustomYouTubeEmbedData;
  private config: any;
  private wrapper: HTMLElement | undefined;

  static get toolbox() {
    return {
      title: 'YouTube',
      icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2C5.12 19.5 12 19.5 12 19.5s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z" fill="red"/><path d="M9.75 15.02l5.75-3.27-5.75-3.27v6.54z" fill="white"/></svg>'
    };
  }

  constructor({ data, api, config }: BlockToolConstructorOptions<CustomYouTubeEmbedData>) {
    this.api = api;
    this.data = data || { url: '' };
    this.config = config || {};
  }

  render(): HTMLElement {
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('youtube-embed-wrapper');

    const input = document.createElement('input');
    input.classList.add('ce-input');
    input.placeholder = this.config.placeholder || 'Enter YouTube video link';
    input.value = this.data.url || '';

    input.addEventListener('change', () => {
      this.data.url = input.value;
      this._renderVideo();
    });

    this.wrapper.appendChild(input);

    if (this.data.url) {
      this._renderVideo();
    }

    return this.wrapper;
  }

  private _renderVideo() {
    if (!this.wrapper) return;
    
    // Remove existing video container if any
    const existingVideo = this.wrapper.querySelector('.video-container');
    if (existingVideo) {
      this.wrapper.removeChild(existingVideo);
    }

    if (!this.data.url) return;

    const videoId = this._extractVideoId(this.data.url);
    if (!videoId) return;

    const videoContainer = document.createElement('div');
    videoContainer.classList.add('video-container');
    videoContainer.style.marginTop = '10px';
    videoContainer.style.position = 'relative';
    videoContainer.style.paddingBottom = '56.25%';
    videoContainer.style.height = '0';
    videoContainer.style.overflow = 'hidden';

    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}`;
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allowfullscreen', 'true');

    videoContainer.appendChild(iframe);
    this.wrapper.appendChild(videoContainer);
  }

  private _extractVideoId(url: string): string | null {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  save(): CustomYouTubeEmbedData {
    return {
      url: this.data.url
    };
  }
}

export default CustomYouTubeEmbed;
