"use client";

import Script from "next/script";

export default function ARPage() {
  const scene = `
    <a-scene
      vr-mode-ui="enabled: false"
      arjs="sourceType: webcam; videoTexture: true; debugUIEnabled: false"
      renderer="antialias: true; alpha: true"
      embedded
    >
      <a-camera
        gps-new-camera="gpsMinDistance: 5"
      ></a-camera>

      <a-entity
        material="color: red"
        geometry="primitive: box"
        gps-new-entity-place="latitude: 14.6507; longitude: 121.1029"
        scale="10 10 10"
      ></a-entity>
    </a-scene>
  `;

  return (
    <>
      <Script
        src="https://aframe.io/releases/1.6.0/aframe.min.js"
        strategy="afterInteractive"
      />

      <Script
        src="https://raw.githack.com/AR-js-org/AR.js/3.4.7/three.js/build/ar-threex-location-only.js"
        strategy="afterInteractive"
      />

      <Script
        src="https://raw.githack.com/AR-js-org/AR.js/3.4.7/aframe/build/aframe-ar.js"
        strategy="afterInteractive"
      />

      <div
        style={{
          position: "fixed",
          inset: 0,
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
        }}
        dangerouslySetInnerHTML={{
          __html: scene,
        }}
      />
    </>
  );
}
