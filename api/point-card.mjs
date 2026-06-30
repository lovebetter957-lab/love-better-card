import React from 'react';
import { ImageResponse } from '@vercel/og';

const h = React.createElement;

function clean(value, fallback = '') {
  const result = String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

  return result || fallback;
}

function getNumber(value, fallback, min, max) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(Math.max(number, min), max);
}

function getRequestUrl(req) {
  const rawUrl = String((req && req.url) || '');

  if (rawUrl.startsWith('http')) {
    return new URL(rawUrl);
  }

  const headers = (req && req.headers) || {};

  const host =
    headers['x-forwarded-host'] ||
    headers.host ||
    'love-better-card.vercel.app';

  const protocol =
    headers['x-forwarded-proto'] ||
    'https';

  return new URL(
    rawUrl || '/api/point-card',
    protocol + '://' + host
  );
}

function textBox(options) {
  return h(
    'div',
    {
      style: {
        position: 'absolute',
        left: options.left + 'px',
        top: options.top + 'px',
        width: options.width + 'px',
        height: options.height + 'px',
        display: 'flex',
        overflow: 'hidden',
        color: options.color || '#ef4398',
        fontSize: options.fontSize + 'px',
        fontWeight: options.fontWeight || 400,
        lineHeight: options.lineHeight || 1.2,
        justifyContent: options.justifyContent || 'flex-start',
        alignItems: options.alignItems || 'flex-start',
        textAlign: options.textAlign || 'left',
        fontFamily: 'sans-serif'
      }
    },
    options.text
  );
}

export default async function handler(req) {
  try {
    const url = getRequestUrl(req);

    const name = clean(
      url.searchParams.get('name'),
      'LINE好友會員'
    ).slice(0, 14);

    const task = clean(
      url.searchParams.get('task'),
      '探索任務'
    ).slice(0, 24);

    const gain = getNumber(
      url.searchParams.get('gain'),
      1,
      1,
      99
    );

    const total = getNumber(
      url.searchParams.get('total'),
      25,
      1,
      99
    );

    const done = getNumber(
      url.searchParams.get('done'),
      0,
      0,
      total
    );

    const remain = getNumber(
      url.searchParams.get('remain'),
      Math.max(total - done, 0),
      0,
      total
    );

    const backgroundUrl =
      url.origin + '/assets/point-card-bg.png';

    const remainingText =
      remain <= 0
        ? '探索旅程已完成，已取得日本來回機票資格'
        : '探索體驗還差 ' +
          remain +
          ' 點，即可獲得日本來回機票';

    const taskFontSize =
      task.length > 16
        ? 28
        : task.length > 11
          ? 34
          : 42;

    const nameFontSize =
      name.length > 9
        ? 24
        : 30;

    const pointCircle = h(
      'div',
      {
        style: {
          position: 'absolute',
          left: '91px',
          top: '326px',
          width: '150px',
          height: '150px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          border: '8px solid #ef4398',
          borderRadius: '999px',
          backgroundColor: '#f8c7da'
        }
      },
      h(
        'div',
        {
          style: {
            display: 'flex',
            color: '#ef4398',
            fontSize: '65px',
            fontWeight: 700,
            lineHeight: 0.9,
            fontFamily: 'sans-serif'
          }
        },
        '+' + gain
      ),
      h(
        'div',
        {
          style: {
            display: 'flex',
            color: '#ef4398',
            fontSize: '25px',
            fontWeight: 700,
            marginTop: '7px',
            fontFamily: 'sans-serif'
          }
        },
        '點'
      )
    );

    const progressCircle = h(
      'div',
      {
        style: {
          position: 'absolute',
          left: '394px',
          top: '326px',
          width: '150px',
          height: '150px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '4px solid #ef4398',
          borderRadius: '999px',
          backgroundColor: '#f8c7da',
          color: '#ef4398',
          fontSize: '43px',
          fontWeight: 700,
          fontFamily: 'sans-serif'
        }
      },
      done + '/' + total
    );

    const button = h(
      'div',
      {
        style: {
          position: 'absolute',
          left: '76px',
          top: '552px',
          width: '488px',
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '999px',
          backgroundColor: '#ffffff',
          color: '#55545a',
          fontSize: '34px',
          fontWeight: 700,
          fontFamily: 'sans-serif'
        }
      },
      '查看我的集點卡'
    );

    const card = h(
      'div',
      {
        style: {
          position: 'relative',
          width: '640px',
          height: '640px',
          display: 'flex',
          overflow: 'hidden',
          backgroundColor: '#f5abc6',
          fontFamily: 'sans-serif'
        }
      },

      h('img', {
        src: backgroundUrl,
        width: '640',
        height: '640',
        style: {
          position: 'absolute',
          left: '0px',
          top: '0px',
          width: '640px',
          height: '640px'
        }
      }),

      textBox({
        left: 42,
        top: 93,
        width: 556,
        height: 52,
        text: '探索完成通知',
        color: '#ef4398',
        fontSize: 43,
        fontWeight: 700
      }),

      textBox({
        left: 42,
        top: 169,
        width: 556,
        height: 40,
        text: name + '　你已完成：',
        color: '#e86aa8',
        fontSize: nameFontSize
      }),

      textBox({
        left: 42,
        top: 211,
        width: 556,
        height: 78,
        text: task,
        color: '#ef4398',
        fontSize: taskFontSize,
        fontWeight: 700,
        lineHeight: 1.12
      }),

      textBox({
        left: 65,
        top: 288,
        width: 205,
        height: 34,
        text: '本次獲得點數',
        color: '#62575d',
        fontSize: 20,
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
      }),

      textBox({
        left: 365,
        top: 288,
        width: 220,
        height: 34,
        text: '目前探索旅程進度',
        color: '#62575d',
        fontSize: 20,
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
      }),

      pointCircle,
      progressCircle,

      textBox({
        left: 42,
        top: 500,
        width: 556,
        height: 42,
        text: remainingText,
        color: '#5d5559',
        fontSize: 23,
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
      }),

      button
    );

    return new ImageResponse(card, {
      width: 640,
      height: 640,
      headers: {
        'Cache-Control': 'public, max-age=300'
      }
    });

  } catch (error) {
    return new Response(
      '圖卡生成失敗：' +
        (error && error.message
          ? error.message
          : String(error)),
      {
        status: 500,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        }
      }
    );
  }
}
