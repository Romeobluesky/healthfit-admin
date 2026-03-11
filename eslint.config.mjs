import nextConfig from "eslint-config-next";

const eslintConfig = [
  ...nextConfig,
  {
    ignores: [".docs/**"],
  },
];

export default eslintConfig;
