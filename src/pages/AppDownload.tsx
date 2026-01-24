import React from 'react';
import { Smartphone, Globe } from 'lucide-react';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=co.median.android.yadezx';
const WEB_APP_URL = 'https://liebefeld.lovable.app';

const AppDownload: React.FC = () => {
  const handlePlatformSelect = (platform: 'android' | 'ios' | 'web') => {
    switch (platform) {
      case 'android':
        window.location.href = PLAY_STORE_URL;
        break;
      case 'ios':
      case 'web':
        window.location.href = WEB_APP_URL;
        break;
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo/Title */}
        <div className="text-center">
          <h1 className="text-4xl font-serif text-gold mb-2">THE TRIBE</h1>
          <p className="text-zinc-400">Wähle deine Plattform</p>
        </div>

        {/* Platform Options */}
        <div className="space-y-3">
          {/* Android */}
          <button
            onClick={() => handlePlatformSelect('android')}
            className="w-full flex items-center gap-4 p-4 bg-zinc-900 border border-white/10 hover:border-gold/30 rounded-lg transition-all group"
          >
            <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-green-500" fill="currentColor">
                <path d="M17.523 0c-.706.014-1.523.171-2.457.538-1.286.506-1.908 1.062-2.74 1.941-.562.595-.85 1.109-1.194 2.127-.31.92-.42 1.562-.435 2.553l-.001.116c.01.876.096 1.467.341 2.266.22.716.429 1.139.838 1.7.208.285.293.378.45.491.24.173.492.224.746.141.213-.07.367-.207.52-.463.137-.228.207-.422.368-1.013.145-.53.226-.754.384-1.057.138-.264.278-.444.47-.6.168-.137.361-.235.576-.287.195-.047.383-.05.604-.008.283.053.523.165.769.361.29.23.527.546.802 1.063.234.439.368.777.553 1.39.27.893.416 1.615.456 2.266.033.54-.003.917-.133 1.366-.153.527-.393.951-.753 1.328-.289.303-.575.516-.993.739-.523.28-.978.419-1.56.476-.497.048-.907.018-1.38-.102-.555-.14-.977-.343-1.504-.722-.447-.322-.759-.633-1.163-1.16-.456-.594-.769-1.156-1.1-1.98-.27-.672-.449-1.309-.596-2.127-.11-.613-.166-1.127-.183-1.687l-.003-.112c-.003-.558.033-1.07.118-1.672.087-.616.189-1.065.368-1.615.205-.63.413-1.065.757-1.581.284-.425.532-.7.912-1.014.375-.31.707-.502 1.157-.666.393-.143.704-.2 1.103-.2.339 0 .61.041.922.143.341.111.585.252.89.512.264.225.426.42.636.763.174.284.273.52.398.943.11.375.164.675.185 1.041.008.139.01.188.01.403 0 .248-.006.349-.027.555-.039.376-.106.673-.234 1.023-.16.437-.333.737-.642 1.118-.224.276-.392.43-.669.61-.331.216-.612.324-.98.379-.188.028-.314.032-.53.017-.286-.02-.49-.066-.748-.17-.305-.124-.526-.277-.789-.547-.299-.307-.48-.594-.688-1.091-.146-.348-.23-.636-.313-1.07-.07-.37-.097-.658-.1-1.052v-.047c.003-.425.044-.773.146-1.219.117-.513.264-.878.534-1.327.234-.389.454-.651.804-.954.327-.283.605-.461 1.002-.64.413-.186.75-.273 1.186-.307.128-.01.195-.013.354-.012.359.003.623.04.954.133.418.118.726.28 1.092.573.381.305.631.606.916 1.101.24.416.381.764.524 1.292.143.529.209.976.223 1.51l.002.075c.002.495-.04.922-.144 1.445-.124.627-.286 1.08-.57 1.597-.284.516-.559.87-.996 1.279-.409.383-.77.617-1.266.819-.441.18-.801.261-1.259.283-.158.008-.238.009-.42.003-.37-.012-.643-.055-.984-.154-.416-.121-.725-.28-1.1-.568-.365-.28-.612-.547-.91-.983-.291-.426-.477-.807-.673-1.383-.18-.527-.28-.98-.349-1.578-.055-.48-.069-.855-.053-1.331.02-.596.081-1.048.221-1.606.155-.618.342-1.065.663-1.585.298-.483.571-.805 1.005-1.186.394-.346.736-.56 1.211-.759.48-.2.877-.295 1.388-.332.163-.012.246-.015.437-.014.406.003.705.04 1.088.134.439.107.77.256 1.183.533.41.275.7.545 1.052.982.325.403.542.762.783 1.296.224.498.361.934.478 1.527.1.507.146.935.157 1.47v.048c0 .596-.059 1.103-.207 1.728-.166.702-.382 1.223-.752 1.814-.352.563-.672.948-1.167 1.403-.459.422-.87.698-1.426.958-.532.249-.98.38-1.548.453-.275.035-.453.045-.761.042-.48-.004-.833-.054-1.262-.177-.514-.148-.899-.35-1.371-.72-.449-.352-.762-.69-1.136-1.227-.346-.497-.577-.955-.828-1.646-.233-.641-.373-1.21-.484-1.959-.09-.608-.127-1.107-.127-1.72 0-.705.055-1.268.196-1.944.15-.72.346-1.264.685-1.9.327-.616.636-1.053 1.123-1.587.445-.488.852-.825 1.42-1.18.524-.327.982-.528 1.574-.691.503-.138.909-.195 1.404-.197.144 0 .218.002.39.01.503.024.873.085 1.323.218.554.163.974.38 1.495.774.501.379.854.74 1.281 1.31.397.53.667 1.026.965 1.774.27.678.434 1.292.569 2.128.109.674.158 1.244.165 1.94l.001.04c.002.716-.054 1.317-.197 2.053-.158.812-.379 1.435-.765 2.16-.361.68-.699 1.152-1.213 1.697-.476.505-.909.849-1.52 1.209-.575.338-1.074.535-1.718.677-.53.117-.952.159-1.468.146-.568-.015-.988-.085-1.51-.253-.586-.188-1.02-.433-1.547-.872-.506-.423-.867-.837-1.302-1.499-.407-.618-.68-1.186-1-2.032-.286-.756-.458-1.441-.596-2.375-.111-.754-.158-1.38-.16-2.153v-.028c.002-.81.066-1.486.228-2.307.173-.875.399-1.545.785-2.328.367-.744.709-1.275 1.227-1.904.48-.583.916-.993 1.535-1.442.577-.42 1.092-.696 1.77-.951.623-.234 1.132-.353 1.754-.409.206-.019.312-.024.56-.027h.033Z"/>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-medium text-lg">Android</p>
              <p className="text-zinc-500 text-sm">Google Play Store</p>
            </div>
            <span className="text-gold text-lg group-hover:translate-x-1 transition-transform">→</span>
          </button>

          {/* iOS */}
          <button
            onClick={() => handlePlatformSelect('ios')}
            className="w-full flex items-center gap-4 p-4 bg-zinc-900 border border-white/10 hover:border-gold/30 rounded-lg transition-all group"
          >
            <div className="w-14 h-14 bg-zinc-700/50 rounded-full flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-7 h-7 text-white" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-medium text-lg">iOS (iPhone/iPad)</p>
              <p className="text-zinc-500 text-sm">Als Web-App installieren</p>
            </div>
            <span className="text-gold text-lg group-hover:translate-x-1 transition-transform">→</span>
          </button>

          {/* Web */}
          <button
            onClick={() => handlePlatformSelect('web')}
            className="w-full flex items-center gap-4 p-4 bg-zinc-900 border border-white/10 hover:border-gold/30 rounded-lg transition-all group"
          >
            <div className="w-14 h-14 bg-blue-500/10 rounded-full flex items-center justify-center">
              <Globe size={28} className="text-blue-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-medium text-lg">Web Browser</p>
              <p className="text-zinc-500 text-sm">Im Browser öffnen</p>
            </div>
            <span className="text-gold text-lg group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-zinc-600 text-xs">
          Entdecke Events und Community in deiner Stadt
        </p>
      </div>
    </div>
  );
};

export default AppDownload;
