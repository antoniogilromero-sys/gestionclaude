export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[520px] flex-1 flex flex-col">
      <div className="bg-surf border-b border-edge px-[18px] pt-[14px] pb-3">
        <div className="font-display text-[13px] tracking-[.16em] uppercase text-mute">
          C.D.E. Triatlón Alpedrete
        </div>
        <div className="mt-[3px] h-[26px] w-40 bg-edge/60 rounded" />
      </div>
      <div className="lane" />
      <main className="px-[18px] pt-4 pb-[26px]">
        <div className="h-4 w-32 bg-edge/40 rounded mb-3.5" />
        <div className="space-y-2.5">
          <div className="h-[76px] bg-surf border border-edge rounded-[10px]" />
          <div className="h-[76px] bg-surf border border-edge rounded-[10px]" />
          <div className="h-[76px] bg-surf border border-edge rounded-[10px]" />
        </div>
      </main>
    </div>
  );
}
