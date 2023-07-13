import {
  describe,
  it,
  vi,
  expect,
} from "vitest";
import { render, fireEvent, screen } from "@testing-library/vue";
import Login from "../Login.vue";

const mockLogin = vi.fn();

vi.mock("./usersStore", () => {
  return {
    useUsers: () => {
      return {
        login: mockLogin,
        user: {
          username: "Lachlan",
        },
      };
    },
  };
});

describe("login with mocking pinia", () => {
  it("works with a fake store, but why would want that", async () => {
    const { container } = render(Login);

    await fireEvent.update(
      container.querySelector("#username")!,
      "Lachlan"
    );
    await fireEvent.update(
      container.querySelector("#password")!,
      "secret-password"
    );
    await fireEvent.click(screen.getByText("Click here to sign in"));

    expect(mockLogin).toHaveBeenCalledWith(
      "Lachlan",
      "secret-password"
    );
  });

  it("renders a user", async () => {
    render(Login);

    await screen.findByText("Hello, Lachlan");
  });
});
