/** Các mục trong khu vực "Quản lý tài khoản" của chophim.wtf.
 *  Nhót Phim giữ lại nhóm chức năng phim + hồ sơ, bỏ CP Coin / gift code /
 *  thẻ cào (cá độ) theo yêu cầu. */

export type AccountTab =
  | "goi-dang-ky"
  | "yeu-thich"
  | "danh-sach"
  | "xem-tiep"
  | "dang-nhap-tv"
  | "thong-bao"
  | "tai-khoan";

export type AccountTabInfo = {
  key: AccountTab;
  label: string;
  title: string;
  subtitle: string;
  /** icon name, được ánh xạ sang SVG trong AccountPage */
  icon:
    | "crown"
    | "heart"
    | "list"
    | "history"
    | "tv"
    | "bell"
    | "user";
};

export const ACCOUNT_TABS: AccountTabInfo[] = [
  {
    key: "goi-dang-ky",
    label: "Gói đăng ký",
    title: "Gói đăng ký",
    subtitle: "Nhót Phim hoàn toàn miễn phí — không quảng cáo, không cá độ.",
    icon: "crown",
  },
  {
    key: "yeu-thich",
    label: "Yêu thích",
    title: "Yêu thích",
    subtitle: "Danh sách phim yêu thích của bạn",
    icon: "heart",
  },
  {
    key: "danh-sach",
    label: "Danh sách",
    title: "Danh sách",
    subtitle: "Những bộ phim bạn muốn xem sau",
    icon: "list",
  },
  {
    key: "xem-tiep",
    label: "Xem tiếp",
    title: "Xem tiếp",
    subtitle: "Tiếp tục các tập phim bạn đang xem dở",
    icon: "history",
  },
  {
    key: "dang-nhap-tv",
    label: "Đăng Nhập TV",
    title: "Xác nhận đăng nhập TV",
    subtitle: "Chỉ xác nhận khi bạn đang nhìn thấy yêu cầu đăng nhập trên TV của mình.",
    icon: "tv",
  },
  {
    key: "thong-bao",
    label: "Thông báo",
    title: "Thông báo",
    subtitle: "Các thông báo mới sẽ hiện ở đây",
    icon: "bell",
  },
  {
    key: "tai-khoan",
    label: "Tài khoản",
    title: "Tài khoản",
    subtitle: "Cập nhật thông tin tài khoản",
    icon: "user",
  },
];

export const ACCOUNT_TAB_KEYS = ACCOUNT_TABS.map((tab) => tab.key);

export function getAccountTab(key: string): AccountTabInfo | undefined {
  return ACCOUNT_TABS.find((tab) => tab.key === key);
}
