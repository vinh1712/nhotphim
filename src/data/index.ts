import homeJson from "./home.json";
import moviesJson from "./movies.json";
import commentsJson from "./comments.json";
import taxonomiesJson from "./taxonomies.json";
import { withBasePathDeep } from "@/lib/base-path";

/**
 * Tất cả URL trong JSON được chuẩn hóa ở đây để chạy được cả ở root
 * lẫn dưới subpath của GitHub Pages (/nhotphim).
 */
export const homeData = withBasePathDeep(homeJson);
export const moviesData = withBasePathDeep(moviesJson);
export const commentsData = withBasePathDeep(commentsJson);
export const taxonomiesData = withBasePathDeep(taxonomiesJson);
