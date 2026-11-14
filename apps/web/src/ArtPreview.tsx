import { useEffect } from "react";

export const ART_MAPS: Record<string, string> = {
  hobbiton: "/maps/art/hobbiton.webp",
  bree: "/maps/art/bree.webp",
  rivendell: "/maps/art/rivendell.webp",
  moria: "/maps/art/moria.webp"
};

interface Props {
  sceneId: string;
  sceneName: string;
  onClose: () => void;
}

export function ArtPreview({ sceneId, sceneName, onClose }: Props) {
  const url = ART_MAPS[sceneId];
  useEffect(() => {
    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", keyHandler);
    return () => window.removeEventListener("keydown", keyHandler);
  }, [onClose]);
  if (!url) return null;

  return (
    <div className="art-backdrop" role="dialog" aria-modal="true" aria-label={"Arte do mapa: " + sceneName}>
      <div className="art-panel">
        <div className="art-header">
          <div>
            <span className="eyebrow">REALMFORGE · CONCEITO VISUAL</span>
            <h2>{sceneName}</h2>
          </div>
          <button className="art-close" onClick={onClose} aria-label="Fechar imagem">×</button>
        </div>
        <div className="art-image-wrap">
          <img src={url} alt={"Ilustração detalhada da região de " + sceneName} />
        </div>
        <div className="art-footer">
          <p>Arte conceitual original. Ainda não alinhada à malha de movimento, colisões e objetos interativos do mapa jogável.</p>
          <a href={url} target="_blank" rel="noreferrer">Abrir imagem em nova aba</a>
        </div>
      </div>
    </div>
  );
}
