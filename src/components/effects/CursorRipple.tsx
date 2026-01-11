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
            // Create subtle aquatic bubbles
            // Reduced frequency: only 50% chance to spawn on move
            if (Math.random() > 0.5) {
                ripplesRef.current.push({
                    x: e.clientX,
                    y: e.clientY,
                    r: Math.random() * 1.5 + 0.5, // Tiny bubbles (0.5px to 2px)
                    alpha: 0.2, // Very low opacity for subtlety
                    speed: Math.random() * 0.1 + 0.05 // Very slow expansion
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
                r.r += r.speed;
                r.alpha -= 0.002; // Very slow fade

                // Gentle drift
                r.x += (Math.random() - 0.5) * 0.1;
                r.y -= 0.2; // Rise

                if (r.alpha <= 0) {
                    ripples.splice(i, 1);
                } else {
                    ctx.beginPath();
                    ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);

                    // Palette: Deep Sea & Gold
                    // Mostly Cyan/White, Occasional Gold
                    ctx.fillStyle = `rgba(34, 211, 238, ${r.alpha})`; // Cyan
                    if (Math.random() > 0.95) {
                        ctx.fillStyle = `rgba(217, 119, 6, ${r.alpha})`; // Gold
                    }

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
