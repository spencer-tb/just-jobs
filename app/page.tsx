import BaseLayout from "./components/base-layout";
import { PageType } from "./types/enums";

const Home: React.FC = () => {
    return <BaseLayout pageType={PageType.HOME} bannerTitle="AI Jobs" />;
};

export default Home;
