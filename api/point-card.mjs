import React from 'react';
import { ImageResponse } from '@vercel/og';

const h = React.createElement;

const APP_URL = 'https://love-better-card.vercel.app';
const BACKGROUND_URL =
  APP_URL + '/assets/point-card-bg.png';

const FONT_CACHE = new Map();

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

function getUrl(request) {
  const rawUrl =
    request && typeof request.url === 'string'
      ? request.url
      : '';

  if (rawUrl.startsWith('http')) {
    return new URL(rawUrl);
  }

  const host =
    request &&
    request.headers &&
    request.headers.host
      ? request.headers.host
      : 'love-better-card.vercel.app';

  return new URL(
    rawUrl || '/api/point-card',
    'https://' + host
  );
}

async function loadFont(text, weight) {
  const cacheKey = weight + ':' + text;

  if (FONT_CACHE.has(cacheKey)) {
    return FONT_CACHE.get(cacheKey);
  }

  const promise = (async function () {
    const cssUrl =
      'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@' +
      weight +
      '&text=' +
      encodeURIComponent(text);

    const cssResponse = await fetch(cssUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 6.1; WOW64; rv:27.0) Gecko/20100101 Firefox/27.0'
      }
    });

    if (!cssResponse.ok) {
      throw new Error('中文字型載入失敗');
    }

    const css = await cssResponse.text();

    const matched = css.match(/url\(([^)]+)\)/);

    if (!matched) {
      throw new Error('找不到中文字型來源');
    }

    const fontUrl = matched[1]
      .replace(/['"]/g, '')
      .trim();

    const fontResponse = await fetch(fontUrl);

    if (!fontResponse.ok) {
      throw new Error('中文字型下載失敗');
    }

    return fontResponse.arrayBuffer();
  })();

  FONT_CACHE.set(cacheKey, promise);

  return promise;
}

function overlay({
  left,
  top,
  width,
  height,
  text,
  color = '#ef4398',
  fontSize = 24,
  fontWeight = 400,
  justifyContent = 'flex-start',
  alignItems = 'flex-start',
  textAlign = 'left',
  lineHeight = 1.2
}) {
  return h(
    'div',
    {
      style: {
        position: 'absolute',
        left: left + 'px',
        top: top + 'px',
        width: width + 'px',
        height: height + 'px',
        display: 'flex',
        overflow: 'hidden',
        color: color,
        fontSize: fontSize + 'px',
        fontWeight: fontWeight,
        justifyContent: justifyContent,
        alignItems: alignItems,
        textAlign: textAlign,
        lineHeight: lineHeight
      }
    },
    text
  );
}

export default async function handler(request) {
  try {
    const url = getUrl(request);

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

    const remainingText =
      remain <= 0
        ? '探索旅程已完成，已取得日本來回機票資格'
        : '探索體驗還差 ' +
          remain +
          ' 點，即可獲得日本來回機票';

    const allText = [
      '探索完成通知',
      '你已完成',
      '本次獲得點數',
      '目前探索旅程進度',
      '點',
      '查看我的集點卡',
      '探索體驗還差',
      '即可獲得日本來回機票',
      '探索旅程已完成，已取得日本來回機票資格',
      name,
      task,
      '+' + gain,
      done + '/' + total,
      remain
    ].join('');

    const fonts = await Promise.all([
      loadFont(allText, 400),
      loadFont(allText, 700)
    ]);

    const regularFont = fonts[0];
    const boldFont = fonts[1];

    const taskFontSize =
      task.length > 16
        ? 27
        : task.length > 11
          ? 33
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
            lineHeight: 0.9
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
            marginTop: '7px'
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
          fontWeight: 700
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
          fontWeight: 700
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
          fontFamily: 'Noto Sans TC'
        }
      },
      h('img', {
        src: BACKGROUND_URL,
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

      overlay({
        left: 42,
        top: 93,
        width: 556,
        height: 52,
        text: '探索完成通知',
        color: '#ef4398',
        fontSize: 43,
        fontWeight: 700
      }),

      overlay({
        left: 42,
        top: 169,
        width: 556,
        height: 40,
        text: name + '　你已完成：',
        color: '#e86aa8',
        fontSize: nameFontSize
      }),

      overlay({
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

      overlay({
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

      overlay({
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

      overlay({
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
      fonts: [
        {
          name: 'Noto Sans TC',
          data: regularFont,
          weight: 400,
          style: 'normal'
        },
        {
          name: 'Noto Sans TC',
          data: boldFont,
          weight: 700,
          style: 'normal'
        }
      ],
      headers: {
        'Cache-Control': 'public, max-age=3600'
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
