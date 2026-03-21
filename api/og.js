import { ImageResponse } from '@vercel/og';

export const config = { runtime: 'edge' };

export default function handler() {
  return new ImageResponse(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0f3460 100%)',
          position: 'relative',
        },
        children: [
          // Decorative blurred circles
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                top: '-50px',
                left: '-50px',
                width: '400px',
                height: '400px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(199,44,65,0.15) 0%, transparent 70%)',
              },
            },
          },
          {
            type: 'div',
            props: {
              style: {
                position: 'absolute',
                bottom: '-80px',
                right: '-50px',
                width: '500px',
                height: '500px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(60,9,108,0.2) 0%, transparent 70%)',
              },
            },
          },
          // Main title
          {
            type: 'div',
            props: {
              style: {
                fontSize: '96px',
                fontWeight: 300,
                color: '#ffffff',
                letterSpacing: '-2px',
                marginBottom: '16px',
              },
              children: 'shows..',
            },
          },
          // Subtitle
          {
            type: 'div',
            props: {
              style: {
                fontSize: '24px',
                fontWeight: 400,
                color: 'rgba(255,255,255,0.5)',
                letterSpacing: '4px',
                textTransform: 'uppercase',
                marginBottom: '32px',
              },
              children: 'Track your artists. Never miss a show.',
            },
          },
          // Accent line
          {
            type: 'div',
            props: {
              style: {
                width: '200px',
                height: '2px',
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '1px',
                marginBottom: '32px',
              },
            },
          },
          // Source badges row
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                gap: '16px',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      padding: '8px 24px',
                      borderRadius: '18px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: '14px',
                      letterSpacing: '1px',
                    },
                    children: 'TICKETMASTER',
                  },
                },
                {
                  type: 'div',
                  props: {
                    style: {
                      padding: '8px 24px',
                      borderRadius: '18px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: 'rgba(255,255,255,0.5)',
                      fontSize: '14px',
                      letterSpacing: '1px',
                    },
                    children: 'SEATGEEK',
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
    },
  );
}
