declare module 'nprogress' {
  interface NProgress {
    start(): NProgress;
    done(force?: boolean): NProgress;
    set(n: number): NProgress;
    isStarted(): boolean;
    configure(options: Record<string, any>): NProgress;
    status: number | null;
  }
  const nprogress: NProgress;
  export default nprogress;
}
