import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: '居家轻症引导问诊',
    template: '%s | 居家轻症引导问诊',
  },
  description:
    '三步式居家轻症引导问诊服务，帮助您条理化梳理病情并提供居家护理方案。仅供轻症参考，不能替代医生面诊。',
  keywords: ['居家问诊', '轻症自检', '家庭医学', '健康引导'],
  authors: [{ name: '居家轻症问诊服务' }],
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="zh-CN">
      <body className="antialiased min-h-screen bg-[#F7FAFC] text-[#1F2937] font-sans">
        {isDev && <Inspector />}
        {children}
      </body>
    </html>
  );
}
