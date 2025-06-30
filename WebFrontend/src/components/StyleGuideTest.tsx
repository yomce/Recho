import React from 'react';

// 재사용 가능한 섹션 컴포넌트
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-48 border-b border-brand-frame pb-24">
    <h2 className="mb-16 text-subheadline text-brand-text-secondary">{title}</h2>
    {children}
  </div>
);

const StyleGuideTest: React.FC = () => {
  return (
    // 1. 전체 화면을 감싸는 Flex 레이아웃 (가운데 정렬 + 배경)
    <div className="centered-card-container">
      {/* 2. 반응형 카드 레이아웃 */}
       <div className=" rounded-card p-24">
        <h1 className="mb-32 text-center text-title">🎨 스타일 가이드 테스트</h1>

        {/* Typography */}
        <Section title="Typography (폰트 스타일)">
          <div className="space-y-8">
            <p className="text-title">Title: 32px Bold</p>
            <p className="text-headline">Headline: 24px Bold</p>
            <p className="text-subheadline">Subheadline: 20px SemiBold</p>
            <p className="text-body">Body: 16px Regular</p>
            <p className="text-button">Button: 16px Bold</p>
            <p className="text-input">Input: 16px Regular</p>
            <p className="text-caption-bold">Caption Bold: 14px Bold</p>
            <p className="text-caption">Caption: 14px Regular</p>
            <p className="text-tag">Tag: 14px SemiBold</p>
            <p className="text-navigation">Navigation: 14px Medium</p>
            <p className="text-footnote">Footnote: 12px Regular</p>
            <p className="text-overline">Overline: 12px Medium</p>
            <p className="text-error">Error: 12px Regular (Red)</p>
          </div>
        </Section>

        {/* Color Palette */}
        <Section title="Color Palette (색상)">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <div className="rounded-button bg-brand-primary p-16 text-center text-brand-text-inverse">
              <p className="text-caption-bold">Primary</p>
              <p className="text-footnote">#8E4DF6</p>
            </div>
            <div className="rounded-button bg-brand-blue p-16 text-center text-brand-text-inverse">
              <p className="text-caption-bold">Blue</p>
              <p className="text-footnote">#4397FD</p>
            </div>
            <div className="rounded-button bg-brand-gray p-16 text-center text-brand-text-inverse">
              <p className="text-caption-bold">Gray</p>
              <p className="text-footnote">#61646B</p>
            </div>
            <div className="rounded-button border border-brand-frame bg-brand-default p-16 text-center text-brand-text-primary">
              <p className="text-caption-bold">Default</p>
              <p className="text-footnote">#FFFFFF</p>
            </div>
          </div>
        </Section>

        {/* Spacing */}
        <Section title="Spacing (간격)">
          <div className="space-y-8">
            <p className="text-body">아래 블록들은 p-8, p-16... 등의 패딩 값을 가집니다.</p>
            <div className="bg-brand-frame p-8 rounded-button">p-8 (8px)</div>
            <div className="bg-brand-frame p-16 rounded-button">p-16 (16px)</div>
            <div className="bg-brand-frame p-24 rounded-button">p-24 (24px)</div>
            <div className="bg-brand-frame p-32 rounded-button">p-32 (32px)</div>
            <div className="bg-brand-frame p-40 rounded-button">p-40 (40px)</div>
            <div className="bg-brand-frame p-48 rounded-button">p-48 (48px)</div>
          </div>
        </Section>

        {/* Components */}
        <Section title="Components (버튼 및 요소)">
          <div className="flex flex-wrap items-center gap-16">
            <button className="rounded-card bg-brand-primary px-24 py-8 text-button text-brand-text-inverse">
              Primary Button
            </button>
            <button className="rounded-button bg-brand-gray px-24 py-8 text-button text-brand-text-inverse">
              Secondary Button
            </button>
            <div className="w-full rounded-card bg-brand-frame p-24">
              <p className="text-body">이것은 'rounded-card' (20px) 스타일이 적용된 카드입니다.</p>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
};

export default StyleGuideTest;