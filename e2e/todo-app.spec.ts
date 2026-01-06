import { test, expect, Page } from '@playwright/test';

// Helper function to create a todo
async function createTodo(page: Page, title: string) {
  const todoInput = page.locator('input[placeholder*="What needs to be done"]');
  await todoInput.fill(title);
  await todoInput.press('Enter');
  // Wait for the todo to appear
  await expect(page.locator('[data-testid="todo-item"]').filter({ hasText: title })).toBeVisible({ timeout: 15000 });
}

test.describe('Authentication', () => {
  test('should show sign in page for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/sign-in/);
  });

  test('should sign up a new user', async ({ page }) => {
    await page.goto('/sign-up');

    await page.fill('input[type="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Should redirect to home after signup
    await expect(page).toHaveURL('/');
  });

  test('should sign in with existing credentials', async ({ page }) => {
    // First sign up
    await page.goto('/sign-up');
    const email = `test-${Date.now()}@example.com`;
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // Sign out
    await page.click('text=Sign Out');
    await expect(page).toHaveURL(/sign-in/);

    // Sign back in
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });
});

test.describe('Todo CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Sign up and get authenticated
    await page.goto('/sign-up');
    await page.fill('input[type="email"]', `todo-test-${Date.now()}@example.com`);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('should create a new todo', async ({ page }) => {
    const todoTitle = `Test Todo ${Date.now()}`;
    await createTodo(page, todoTitle);
  });

  test('should toggle todo completion', async ({ page }) => {
    const todoTitle = `Toggle Test ${Date.now()}`;
    await createTodo(page, todoTitle);

    // Get the todo item and checkbox
    const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: todoTitle });
    const checkbox = todoItem.locator('input[type="checkbox"]').first();

    // Use JavaScript click (works better with React controlled checkboxes)
    await checkbox.evaluate((el: HTMLInputElement) => el.click());
    await page.waitForTimeout(500);

    // Checkbox should be checked now
    await expect(checkbox).toBeChecked({ timeout: 10000 });
  });

  test('should edit a todo', async ({ page }) => {
    const originalTitle = `Original ${Date.now()}`;
    const newTitle = `Updated ${Date.now()}`;

    await createTodo(page, originalTitle);

    // Click the Edit button using JavaScript (works better with React)
    const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: originalTitle });
    await todoItem.hover();
    const editButton = todoItem.locator('button[title="Edit"]');
    await expect(editButton).toBeVisible();
    await editButton.evaluate((el: HTMLButtonElement) => el.click());
    await page.waitForTimeout(300);

    // Find and fill the edit input
    const titleInput = page.locator('input[placeholder="Todo title"]');
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.clear();
    await titleInput.fill(newTitle);
    await page.getByRole('button', { name: 'Save', exact: true }).click();

    // New title should appear
    await expect(page.locator('[data-testid="todo-item"]').filter({ hasText: newTitle })).toBeVisible({ timeout: 10000 });
  });

  test('should delete a todo with undo', async ({ page }) => {
    const todoTitle = `Delete Test ${Date.now()}`;
    await createTodo(page, todoTitle);

    // Hover and click delete button using JavaScript
    const todoItem = page.locator('[data-testid="todo-item"]').filter({ hasText: todoTitle });
    await todoItem.hover();
    const deleteButton = todoItem.locator('button[title="Delete"]');
    await expect(deleteButton).toBeVisible();
    await deleteButton.evaluate((el: HTMLButtonElement) => el.click());

    // Undo toast should appear
    await expect(page.locator('text=Undo')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Todo Filtering and Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-up');
    await page.fill('input[type="email"]', `filter-test-${Date.now()}@example.com`);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');

    // Create some todos
    await createTodo(page, 'Active Task 1');
    await createTodo(page, 'Active Task 2');
    await createTodo(page, 'Completed Task');

    // Complete one todo using JavaScript click (works better with React controlled components)
    const completedTodo = page.locator('[data-testid="todo-item"]').filter({ hasText: 'Completed Task' });
    const checkbox = completedTodo.locator('input[type="checkbox"]').first();

    await checkbox.evaluate((el: HTMLInputElement) => el.click());
    await page.waitForTimeout(500);

    // Wait for the checkbox to be checked
    await expect(checkbox).toBeChecked({ timeout: 10000 });
  });

  test('should filter active todos', async ({ page }) => {
    // Click Active filter tab using JavaScript
    const activeTab = page.locator('button[role="tab"]:has-text("Active")');
    await activeTab.evaluate((el: HTMLButtonElement) => el.click());
    await page.waitForTimeout(300);

    await expect(page.locator('[data-testid="todo-item"]').filter({ hasText: 'Active Task 1' })).toBeVisible();
    await expect(page.locator('[data-testid="todo-item"]').filter({ hasText: 'Active Task 2' })).toBeVisible();
    await expect(page.locator('[data-testid="todo-item"]').filter({ hasText: 'Completed Task' })).not.toBeVisible();
  });

  test('should filter completed todos', async ({ page }) => {
    // Click Completed filter tab using JavaScript
    const completedTab = page.locator('button[role="tab"]:has-text("Completed")');
    await completedTab.evaluate((el: HTMLButtonElement) => el.click());
    await page.waitForTimeout(300);

    await expect(page.locator('[data-testid="todo-item"]').filter({ hasText: 'Active Task 1' })).not.toBeVisible();
    await expect(page.locator('[data-testid="todo-item"]').filter({ hasText: 'Active Task 2' })).not.toBeVisible();
    await expect(page.locator('[data-testid="todo-item"]').filter({ hasText: 'Completed Task' })).toBeVisible();
  });

  test('should search todos', async ({ page }) => {
    await page.fill('input[type="search"]', 'Task 1');

    await expect(page.locator('[data-testid="todo-item"]').filter({ hasText: 'Active Task 1' })).toBeVisible();
    await expect(page.locator('[data-testid="todo-item"]').filter({ hasText: 'Active Task 2' })).not.toBeVisible();
    await expect(page.locator('[data-testid="todo-item"]').filter({ hasText: 'Completed Task' })).not.toBeVisible();
  });
});

test.describe('Todo Priority and Due Date', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-up');
    await page.fill('input[type="email"]', `priority-test-${Date.now()}@example.com`);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('should set priority on new todo', async ({ page }) => {
    // Click on input to focus/expand form
    const todoInput = page.locator('input[placeholder*="What needs to be done"]');
    await todoInput.fill('High Priority Task');

    // Wait for form to expand
    await expect(page.locator('select').first()).toBeVisible({ timeout: 5000 });

    // Set priority to High
    await page.locator('select').first().selectOption({ label: 'High' });

    // Submit
    await todoInput.press('Enter');

    // Should see the priority task
    await expect(page.locator('[data-testid="todo-item"]').filter({ hasText: 'High Priority Task' })).toBeVisible({ timeout: 15000 });
  });

  test('should set due date on new todo', async ({ page }) => {
    const todoInput = page.locator('input[placeholder*="What needs to be done"]');
    await todoInput.fill('Task with Due Date');

    // Wait for form to expand
    await expect(page.locator('input[type="date"]')).toBeVisible({ timeout: 5000 });

    // Set due date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    await page.locator('input[type="date"]').fill(dateStr);

    // Submit
    await todoInput.press('Enter');

    // Should see the task
    await expect(page.locator('[data-testid="todo-item"]').filter({ hasText: 'Task with Due Date' })).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-up');
    await page.fill('input[type="email"]', `nav-test-${Date.now()}@example.com`);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('should navigate to statistics page', async ({ page }) => {
    await page.click('text=View Statistics');
    await expect(page).toHaveURL('/stats');
    await expect(page.locator('h1:has-text("Statistics")')).toBeVisible();
  });

  test('should navigate to calendar page', async ({ page }) => {
    await page.click('text=Calendar View');
    await expect(page).toHaveURL('/calendar');
  });

  test('should navigate back to home from stats', async ({ page }) => {
    await page.click('text=View Statistics');
    await expect(page).toHaveURL('/stats');

    // Click the back arrow button (first button in header)
    await page.click('header button:first-child');
    await expect(page).toHaveURL('/');
  });
});

test.describe('Theme Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-up');
    await page.fill('input[type="email"]', `theme-test-${Date.now()}@example.com`);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('should toggle dark mode', async ({ page }) => {
    // The default is "System", click Dark to switch
    const darkButton = page.locator('button[title="Dark"]');
    await darkButton.click();

    // Check that dark class is on html element
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Toggle to light
    const lightButton = page.locator('button[title="Light"]');
    await lightButton.click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });
});

test.describe('Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sign-up');
    await page.fill('input[type="email"]', `keyboard-test-${Date.now()}@example.com`);
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('should open keyboard shortcuts modal', async ({ page }) => {
    // Press Shift+?
    await page.keyboard.press('Shift+?');

    // Modal should be visible
    await expect(page.locator('text="Keyboard Shortcuts"')).toBeVisible();

    // Close modal
    await page.keyboard.press('Escape');
    await expect(page.locator('text="Keyboard Shortcuts"')).not.toBeVisible();
  });

  test('should focus new todo input with Ctrl+N', async ({ page }) => {
    // Make sure page body has focus first
    await page.locator('body').click();
    await page.waitForTimeout(100);

    // Dispatch the keyboard event directly to avoid browser interception
    await page.evaluate(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'n',
        code: 'KeyN',
        ctrlKey: true,
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(event);
    });

    await page.waitForTimeout(300);

    // Input should be focused
    const input = page.locator('input[placeholder*="What needs to be done"]');
    await expect(input).toBeFocused({ timeout: 5000 });
  });
});
