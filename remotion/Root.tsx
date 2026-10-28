// Remotion root — registers the Zecrow demo composition.
import { Composition } from "remotion";
import { ZecrowDemo, DEMO_DURATION } from "./ZecrowDemo";

export function RemotionRoot() {
  return (
    <Composition
      id="ZecrowDemo"
      component={ZecrowDemo}
      durationInFrames={DEMO_DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
  );
}
