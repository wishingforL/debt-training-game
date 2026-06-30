type StartScreenProps = {
  startHero: string;
  onStartTutorial: () => void;
};

export function StartScreen({ startHero, onStartTutorial }: StartScreenProps) {
  return (
    <section className="start-screen intro-screen">
      <button className="intro-poster" onClick={onStartTutorial} type="button">
        <img src={startHero} alt="Mystery at the desk 시작 화면" />
      </button>
    </section>
  );
}
