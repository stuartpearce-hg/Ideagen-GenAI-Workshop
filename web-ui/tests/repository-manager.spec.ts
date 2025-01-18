import { test, expect } from '@playwright/test';

test.describe('Repository Manager', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display repository upload interface', async ({ page }) => {
    await expect(page.getByText('Drag and drop a folder here')).toBeVisible();
    await expect(page.getByLabel('Repository Name')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Index Repository' })).toBeVisible();
  });

  test('should disallow empty repository name', async ({ page }) => {
    // Try to click index button without a name
    await page.getByRole('button', { name: 'Index Repository' }).click();
    
    // Should see error message
    await expect(page.getByText('Please enter a name for the repository')).toBeVisible();
  });

  test('should show repository in dropdown after indexing', async ({ page }) => {
    // Fill repository name
    await page.getByLabel('Repository Name').fill('test-repo');
    
    // Create a test file for upload
    const testFile = 'test-file.js';
    await page.evaluate(() => {
      const dataTransfer = new DataTransfer();
      const file = new File(['console.log("test")'], 'test-file.js', { type: 'text/javascript' });
      dataTransfer.items.add(file);
      
      // Dispatch drop event on the dropzone
      const dropEvent = new DragEvent('drop', { dataTransfer });
      document.querySelector('[role="button"]')?.dispatchEvent(dropEvent);
    });

    // Should see success message
    await expect(page.getByText('Successfully indexed test-repo')).toBeVisible();
    
    // Repository should appear in dropdown
    await expect(page.getByRole('combobox')).toContainText('test-repo');
  });
});
