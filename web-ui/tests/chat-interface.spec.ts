import { test, expect } from '@playwright/test';

test.describe('Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Setup: Create and select a repository
    await page.getByLabel('Repository Name').fill('test-repo');
    await page.evaluate(() => {
      const dataTransfer = new DataTransfer();
      const file = new File(['console.log("test")'], 'test-file.js', { type: 'text/javascript' });
      dataTransfer.items.add(file);
      document.querySelector('[role="button"]')?.dispatchEvent(new DragEvent('drop', { dataTransfer }));
    });
    await page.getByRole('combobox').selectOption('test-repo');
  });

  test('should show chat interface after selecting repository', async ({ page }) => {
    await expect(page.getByPlaceholder('Type your message...')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
  });

  test('should not allow empty messages', async ({ page }) => {
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.getByText('Please enter a message')).toBeVisible();
  });

  test('should send message and display response', async ({ page }) => {
    const testMessage = 'Tell me about the code';
    await page.getByPlaceholder('Type your message...').fill(testMessage);
    await page.getByRole('button', { name: 'Send' }).click();

    // Check if message appears in chat
    await expect(page.getByText(testMessage)).toBeVisible();
    
    // Wait for and verify response
    await expect(page.getByRole('article').filter({ hasText: 'assistant' })).toBeVisible();
  });
});
