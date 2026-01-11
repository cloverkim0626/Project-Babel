import { useEffect, useRef } from 'react';

export const CursorRipple = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const ripplesRef = useRef<{ x: number; y: number; r: number; alpha: number; speed: number }[]>([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();

        const spawnRipple = (e: MouseEvent) => {
            // Create aquatic particles
            for (let i = 0; i < 2; i++) {
                ripplesRef.current.push({
                    x: e.clientX,
                    y: e.clientY,
                    r: Math.random() * 2 + 1, // Start small
                    alpha: 0.6,
                    speed: Math.random() * 0.5 + 0.2
                });
            }
        };

        window.addEventListener('mousemove', spawnRipple);

        const animate = () => {
            if (!canvas || !ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const ripples = ripplesRef.current;
            for (let i = ripples.length - 1; i >= 0; i--) {
                const r = ripples[i];
                r.r += r.speed; // Expand
                r.alpha -= 0.01; // Fade

                // Drift effect (simulating water current)
                r.x += (Math.random() - 0.5) * 0.5;
                r.y -= 0.5; // Bubbles rise

                if (r.alpha <= 0) {
                    ripples.splice(i, 1);
                } else {
                    ctx.beginPath();
                    ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
                    // Gold/Cyan tint
                    ctx.fillStyle = `rgba(34, 211, 238, ${r.alpha})`; // Cyan
                    if (Math.random() > 0.8) {
                        ctx.fillStyle = `rgba(217, 119, 6, ${r.alpha})`; // Occasional Amber
                    }
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = "cyan";
                    ctx.fill();
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('mousemove', spawnRipple);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-[9999]"
            style={{ mixBlendMode: 'screen' }}
        />
    );
};
