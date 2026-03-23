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
          background: '#0a0a0a',
          position: 'relative',
        },
        children: [
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
                width: '120px',
                height: '1px',
                background: 'rgba(255,255,255,0.1)',
                borderRadius: '1px',
                marginBottom: '24px',
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
      height: 400,
    },
  );
}
