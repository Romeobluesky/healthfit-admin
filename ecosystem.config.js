module.exports = {
  apps: [
    {
      name: "healthfit-admin",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 9003",
      cwd: "/home/healthfit-admin",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 9003,
        NEXT_PUBLIC_API_URL: "https://healthfit.autocallup.com",
      },
      // 로그 설정
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      error_file: "/home/healthfit-admin/logs/error.log",
      out_file: "/home/healthfit-admin/logs/out.log",
      merge_logs: true,
      // 자동 재시작
      watch: false,
      max_memory_restart: "512M",
      restart_delay: 5000,
      max_restarts: 10,
    },
  ],
};
