import { act, renderHook } from "@testing-library/react";
import { useIndexingPolling } from "./use-indexing-polling";

describe("useIndexingPolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("polls on the configured interval and stops when disabled", () => {
    const onPoll = vi.fn();
    const { rerender, unmount } = renderHook(
      ({ enabled }) => useIndexingPolling({ enabled, onPoll, intervalMs: 3_000 }),
      { initialProps: { enabled: true } }
    );

    act(() => vi.advanceTimersByTime(2_999));
    expect(onPoll).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(onPoll).toHaveBeenCalledTimes(1);

    rerender({ enabled: true });
    act(() => vi.advanceTimersByTime(3_000));
    expect(onPoll).toHaveBeenCalledTimes(2);

    rerender({ enabled: false });
    act(() => vi.advanceTimersByTime(6_000));
    expect(onPoll).toHaveBeenCalledTimes(2);

    unmount();
  });
});
