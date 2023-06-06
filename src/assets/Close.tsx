import Svg, { Path } from "react-native-svg";
const Close = (props:any) => (
  <Svg
    xmlns="http://www.w3.org/2000/svg"
    className="ionicon"
    viewBox="0 0 512 512"
    {...props}
  >
    <Path
     {...props}
      fill="none"
    //   stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={32}
      d="M368 368L144 144M368 144L144 368"
    />
  </Svg>
);
export default Close;
