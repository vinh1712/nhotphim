/** Dùng chung giữa layout (head script) và client: chỉ bỏ overlay khi người dùng
 *  bấm link nội bộ thật sự, không phải khi trình duyệt tự reload tab cũ. */
export const SKIP_OVERLAY_KEY = "nhotphim:skip-overlay:v1";

/** Tab nằm im quá lâu rồi quay lại thì phát lại đúng overlay clone chophim
 *  trong lúc lớp dữ liệu sống refresh. */
export const SHOW_LOADING_EVENT = "nhotphim:show-loading";
export const WAKE_REFRESH_MS = 60_000;
