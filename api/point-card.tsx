import React from 'react';
import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge'
};

const FONT_CACHE = new Map();

function clean(value, fallback) {
  const result = String(value || '').replace(/\s+/g, ' ').trim();
  return result || fallback || '';
}

function numberValue(value, fallback, min, max) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return fallback;
  }

  return Math.min(Math.max(number, min), max);
}

async function loadFont(text) {
  if (FONT_CACHE.has(text)) {
    return FONT_CACHE.get(text);
  }

  const promise = (async function() {
    const cssUrl =
      'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400&text=' +
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
    const match = css.match(/src:\s*url\(([^)]+)\)/);

    if (!match) {
      throw new Error('找不到中文字型來源');
    }

    const fontUrl = match[1].replace(/['"]/g, '');
    const fontResponse = await fetch(fontUrl);

    if (!fontResponse.ok) {
      throw new Error('中文字型下載失敗');
    }

    return fontResponse.arrayBuffer();
  })();

  FONT_CACHE.set(text, promise);

  return promise;
}

async function getBackgroundUrl(request) {
  const origin = new URL(request.url).origin;

  const candidates = [
    '/assets/point-card-bg.png',
    '/assets/%E9%9B%86%E9%BB%9E%E5%8D%A1%E8%83%8C%E6%99%AF(1).png',
    '/assets/%E9%9B%86%E9%BB%9E%E5%8D%A1%E8%83%8C%E6%99%AF.png'
  ];

  for (const path of candidates) {
    const url = origin + path;

    try {
      const response = await fetch(url, {
        method: 'HEAD'
      });

      if (response.ok) {
        return url;
      }
    } catch (error) {}
  }

  return origin + candidates[0];
}

export default async function handler(request) {
  try {
    const url = new URL(request.url);

    const name = clean(
      url.searchParams.get('name'),
      'LINE好友會員'
    ).slice(0, 14);

    const task = clean(
      url.searchParams.get('task'),
      '探索任務'
    ).slice(0, 24);

    const gain = numberValue(
      url.searchParams.get('gain'),
      1,
      1,
      99
    );

    const total = numberValue(
      url.searchParams.get('total'),
      25,
      1,
      99
    );

    const done = numberValue(
      url.searchParams.get('done'),
      0,
      0,
      total
    );

    const remain = numberValue(
      url.searchParams.get('remain'),
      Math.max(total - done, 0),
      0,
      total
    );

    const allText = [
      'Love Better',
      '探索完成通知',
      '你已完成',
      '本次獲得點數',
      '目前探索旅程進度',
      '點',
      '探索體驗還差',
      '即可獲得日本來回機票',
      '查看我的集點卡',
      name,
      task,
      '+' + gain,
      done + '/' + total,
      remain
    ].join('');

    const backgroundUrl = await getBackgroundUrl(request);
    const fontData = await loadFont(allText);

    const taskFontSize = task.length >= 17
      ? 29
      : task.length >= 12
        ? 34
        : 41;

    const nameFontSize = name.length >= 9
      ? 25
      : 30;

    const remainingText = remain <= 0
      ? '探索旅程已完成，已取得日本來回機票資格'
      : '探索體驗還差 ' +
        remain +
        ' 點，即可獲得日本來回機票';

    return new ImageResponse(
      (
        <div
          style={{
            width: '640px',
            height: '640px',
            display: 'flex',
            position: 'relative',
            overflow: 'hidden',
            background: '#f6abc7',
            fontFamily: 'Noto Sans TC'
          }}
        >
          <img
            src={backgroundUrl}
            width="640"
            height="640"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '640px',
              height: '640px'
            }}
          />

          <div
            style={{
              position: 'absolute',
              left: '42px',
              top: '93px',
              width: '556px',
              display: 'flex',
              color: '#ef4398',
              fontSize: '43px',
              fontWeight: 700,
              lineHeight: 1
            }}
          >
            探索完成通知
          </div>

          <div
            style={{
              position: 'absolute',
              left: '42px',
              top: '169px',
              width: '556px',
              display: 'flex',
              color: '#e86aa8',
              fontSize: nameFontSize + 'px',
              lineHeight: 1.2,
              whiteSpace: 'nowrap'
            }}
          >
            {name}　你已完成：
          </div>

          <div
            style={{
              position: 'absolute',
              left: '42px',
              top: '211px',
              width: '556px',
              height: '80px',
              display: 'flex',
              color: '#ef4398',
              fontSize: taskFontSize + 'px',
              fontWeight: 700,
              lineHeight: 1.15,
              overflow: 'hidden'
            }}
          >
            {task}
          </div>

          <div
            style={{
              position: 'absolute',
              left: '64px',
              top: '288px',
              width: '210px',
              display: 'flex',
              justifyContent: 'center',
              color: '#62575d',
              fontSize: '20px'
            }}
          >
            本次獲得點數
          </div>

          <div
            style={{
              position: 'absolute',
              left: '365px',
              top: '288px',
              width: '220px',
              display: 'flex',
              justifyContent: 'center',
              color: '#62575d',
              fontSize: '20px'
            }}
          >
            目前探索旅程進度
          </div>

          <div
            style={{
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
              background: '#f8c7da'
            }}
          >
            <div
              style={{
                display: 'flex',
                color: '#ef4398',
                fontSize: '65px',
                fontWeight: 700,
                lineHeight: 0.9
              }}
            >
              +{gain}
            </div>

            <div
              style={{
                display: 'flex',
                color: '#ef4398',
                fontSize: '25px',
                fontWeight: 700,
                marginTop: '7px'
              }}
            >
              點
            </div>
          </div>

          <div
            style={{
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
              background: '#f8c7da',
              color: '#ef4398',
              fontSize: '43px',
              fontWeight: 700
            }}
          >
            {done}/{total}
          </div>

          <div
            style={{
              position: 'absolute',
              left: '42px',
              top: '500px',
              width: '556px',
              height: '42px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              color: '#5d5559',
              fontSize: '24px',
              textAlign: 'center',
              lineHeight: 1.25
            }}
          >
            {remainingText}
          </div>

          <div
            style={{
              position: 'absolute',
              left: '76px',
              top: '552px',
              width: '488px',
              height: '70px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '999px',
              background: '#ffffff',
              color: '#55545a',
              fontSize: '34px',
              fontWeight: 700
            }}
          >
            查看我的集點卡
          </div>
        </div>
      ),
      {
        width: 640,
        height: 640,
        fonts: [
          {
            name: 'Noto Sans TC',
            data: fontData,
            weight: 400,
            style: 'normal'
          },
          {
            name: 'Noto Sans TC',
            data: fontData,
            weight: 700,
            style: 'normal'
          }
        ],
        headers: {
          'Cache-Control': 'public, max-age=3600'
        }
      }
    );

  } catch (error) {
    return new Response(
      '圖卡生成失敗：' +
        (error && error.message ? error.message : String(error)),
      {
        status: 500,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8'
        }
      }
    );
  }
}
