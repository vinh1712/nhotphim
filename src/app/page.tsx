import { home } from "@/components/sites/chophim/types";
import { Header } from "@/components/sites/chophim/Header";
import { Hero } from "@/components/sites/chophim/Hero";
import { MobileHero } from "@/components/sites/chophim/MobileHero";
import { Topics } from "@/components/sites/chophim/Topics";
import { LoginBanner } from "@/components/sites/chophim/LoginBanner";
import { MovieRow } from "@/components/sites/chophim/MovieRow";
import { SocialBox } from "@/components/sites/chophim/SocialBox";
import { BilingualSection } from "@/components/sites/chophim/BilingualSection";
import { PosterRow } from "@/components/sites/chophim/PosterRow";
import { Top10Row } from "@/components/sites/chophim/Top10Row";
import { FeaturedRow } from "@/components/sites/chophim/FeaturedRow";
import { AnimeSection } from "@/components/sites/chophim/AnimeSection";
import { Footer } from "@/components/sites/chophim/Footer";

const byId = (id: string) => {
  const s = home.sections.find((x) => x.id === id);
  if (!s) throw new Error(`Missing section ${id}`);
  return s;
};

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="flex-1 pt-16">
        <Hero />
        <MobileHero />
        <div className="mx-auto mt-4 max-w-[1400px] space-y-12 px-4 pb-20 md:mt-12">
          <Topics />
          <LoginBanner />

          <MovieRow section={byId("S:2")} />
          <MovieRow section={byId("S:3")} />
          <MovieRow section={byId("S:4")} />

          <SocialBox />
          <BilingualSection section={byId("S:7")} />

          <PosterRow section={byId("S:8")} />
          <Top10Row section={byId("S:9")} />
          <FeaturedRow section={byId("S:a")} href="/the-loai/kinh-di" />
          <PosterRow section={byId("S:b")} viewAll={{ label: "Xem tất cả", href: "/phim-bo" }} />
          <PosterRow
            section={byId("S:c")}
            viewAll={{ label: "Xem tất cả", href: "/phim-sap-chieu" }}
          />
          <FeaturedRow section={byId("S:d")} href="/phim-chieu-rap" />
          <Top10Row section={byId("S:e")} />
          <AnimeSection />
        </div>
      </main>
      <Footer />
    </>
  );
}
