/**
 * Video presets for common social network publishing targets.
 *
 * Each preset defines the recommended width, height, and fps for a given
 * platform. Users can still override any individual value in the Config block
 * — VideoPreset acts as a named defaults layer, not a hard lock.
 */

export const VideoPreset = Object.freeze({
  YOUTUBE: 'YouTube',
  YOUTUBE_SHORTS: 'YouTubeShorts',
  INSTAGRAM_REEL: 'InstagramReel',
  INSTAGRAM_POST: 'InstagramPost',
  INSTAGRAM_POST_PORTRAIT: 'InstagramPostPortrait',
  TIKTOK: 'TikTok',
  TWITTER: 'Twitter',
  LINKEDIN: 'LinkedIn',
  FACEBOOK: 'Facebook',
  FACEBOOK_REEL: 'FacebookReel',
});

export const VIDEO_PRESETS = Object.freeze({
  YouTube:               { width: 1920, height: 1080, fps: 30 },
  YouTubeShorts:         { width: 1080, height: 1920, fps: 30 },
  InstagramReel:         { width: 1080, height: 1920, fps: 30 },
  InstagramPost:         { width: 1080, height: 1080, fps: 30 },
  InstagramPostPortrait: { width: 1080, height: 1350, fps: 30 },
  TikTok:                { width: 1080, height: 1920, fps: 30 },
  Twitter:               { width: 1280, height: 720,  fps: 30 },
  LinkedIn:              { width: 1920, height: 1080, fps: 30 },
  Facebook:              { width: 1920, height: 1080, fps: 30 },
  FacebookReel:          { width: 1080, height: 1920, fps: 30 },
});
