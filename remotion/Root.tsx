// Remotion root — registers the Zecrow demo composition.
import { Composition } from "remotion";
import { ZecrowDemo } from "./ZecrowDemo";

export function RemotionRoot() {
  return (
    <Composition
      id="ZecrowDemo"
      component={ZecrowDemo}
      durationInFrames={2250}
      fps={30}
      width={1920}
      height={1080}
    />
  );
}
