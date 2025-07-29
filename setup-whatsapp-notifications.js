// Setup script for WhatsApp notifications
// Run this in the browser console to configure the system

console.log('🔧 Setting up WhatsApp Notifications...');

// Step 1: Check current configuration
function checkConfiguration() {
  console.log('📋 Checking current configuration...');

  import('./js/config/constants.js')
    .then(({ WHATSAPP_CONFIG }) => {
      console.log('✅ WhatsApp config loaded');
      console.log(
        '   API Key:',
        WHATSAPP_CONFIG.API_KEY === 4491919
          ? '❌ Not configured'
          : '✅ Configured'
      );
      console.log('   Timezone:', WHATSAPP_CONFIG.TIMEZONE);
      console.log('   API URL:', WHATSAPP_CONFIG.API_BASE_URL);
    })
    .catch(error => {
      console.error('❌ Error loading configuration:', error);
    });
}

// Step 2: Test phone validation
function testPhoneValidation() {
  console.log('📱 Testing phone validation...');

  import('./js/utils/phoneValidator.js')
    .then(({ PhoneValidator }) => {
      const testNumbers = [
        '01161174746',
        '+54 11 174746',
        '5491161174746',
        '123',
        '',
        'invalid',
      ];

      testNumbers.forEach(phone => {
        const result = PhoneValidator.validatePhone(phone);
        console.log(
          `   ${phone}: ${result.isValid ? '✅ Valid' : '❌ Invalid'} - ${result.error || 'OK'}`
        );
      });
    })
    .catch(error => {
      console.error('❌ Error testing phone validation:', error);
    });
}

// Step 3: Check users with valid phones
function checkUsersWithValidPhones() {
  console.log('👥 Checking users with valid phones...');

  import('./js/modules/authManager.js')
    .then(({ authManager }) => {
      // Get current user to test
      const currentUser = authManager.getCurrentUser();
      if (currentUser) {
        console.log('✅ Current user found:', currentUser.uid);

        if (currentUser.phone) {
          import('./js/utils/phoneValidator.js').then(({ PhoneValidator }) => {
            const validation = PhoneValidator.validatePhone(currentUser.phone);
            console.log(`   Phone: ${currentUser.phone}`);
            console.log(`   Valid: ${validation.isValid ? '✅ Yes' : '❌ No'}`);
            if (!validation.isValid) {
              console.log(`   Error: ${validation.error}`);
            }
          });
        } else {
          console.log('❌ Current user has no phone number');
        }
      } else {
        console.log('❌ No current user found');
      }
    })
    .catch(error => {
      console.error('❌ Error checking users:', error);
    });
}

// Step 4: Test WhatsApp API connection
function testWhatsAppAPI() {
  console.log('📡 Testing WhatsApp API connection...');

  import('./js/config/constants.js')
    .then(({ WHATSAPP_CONFIG }) => {
      if (WHATSAPP_CONFIG.API_KEY === 'YOUR_CALLMEBOT_API_KEY_HERE') {
        console.log('❌ API Key not configured. Please configure it first.');
        return;
      }

      // Test API URL
      const testUrl = `${WHATSAPP_CONFIG.API_BASE_URL}?phone=541161174746&text=Test&apikey=${WHATSAPP_CONFIG.API_KEY}`;
      console.log('   Test URL:', testUrl);

      // Note: This will fail with a test number, but it tests the API connection
      fetch(testUrl)
        .then(response => {
          console.log('   API Response Status:', response.status);
          return response.text();
        })
        .then(result => {
          console.log('   API Response:', result);
        })
        .catch(error => {
          console.log(
            '   API Error (expected with test number):',
            error.message
          );
        });
    })
    .catch(error => {
      console.error('❌ Error testing API:', error);
    });
}

// Step 5: Setup instructions
function showSetupInstructions() {
  console.log('📖 Setup Instructions:');
  console.log('');
  console.log('1. 🔑 Get CallMeBot API Key:');
  console.log('   - Go to https://www.callmebot.com/');
  console.log('   - Create a free account');
  console.log(
    '   - Get your API key from: https://www.callmebot.com/blog/free-api-whatsapp-messages/'
  );
  console.log('');
  console.log('2. ⚙️ Configure API Key:');
  console.log('   - Open js/config/constants.js');
  console.log(
    '   - Replace "YOUR_CALLMEBOT_API_KEY_HERE" with your actual API key'
  );
  console.log('');
  console.log('3. 📱 Add phone numbers to user profiles:');
  console.log('   - Users must have valid Argentine phone numbers');
  console.log('   - Format: 01112345678 or +54 11 1234-5678');
  console.log('');
  console.log('4. 🚀 Start the reminder service:');
  console.log('   - The system will automatically send notifications');
  console.log('   - Reminders are sent 48h and 24h before events');
  console.log('');
  console.log('5. 🧪 Test the system:');
  console.log('   - Create a test event');
  console.log('   - Check if notifications are sent');
  console.log('   - Monitor logs in the console');
}

// Run all setup checks
function runSetup() {
  console.log('🚀 Running WhatsApp notification setup...');

  checkConfiguration();

  setTimeout(() => {
    testPhoneValidation();
  }, 1000);

  setTimeout(() => {
    checkUsersWithValidPhones();
  }, 2000);

  setTimeout(() => {
    testWhatsAppAPI();
  }, 3000);

  setTimeout(() => {
    showSetupInstructions();
  }, 4000);
}

// Auto-run setup
runSetup();
