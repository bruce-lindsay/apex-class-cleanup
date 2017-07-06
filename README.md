apex-class-cleanup
===
## Purpose
Identify classes no longer in a local folder and delete them from a salesforce org. This is useful when tracking apex classes in local source control and switching branches between deployment has left extra classes in your org. These extra classes sometimes no longer compile and can cause errors when running the tests in the org.

## Usage - Execute the Sample
Copy the sample-usage.js file into your working directory. Replace the empty strings supplied to the options object for user, password, and security token with your own values. Update the option for working directory to the file path containing your apex classes. Run the script using node.

The committed sample is preset to delete extra classes after a confirmation prompt. It will only delete classes when you type 'y' and hit enter.

In order to excercise generating a destructive changes xml file comment line 16-18 of the sample and uncomment 21 - 26.

## Usage - module

As in the sample-usage.js file, require the module. Setup an options object that contains the required values. From the module, call one of two methods.

__deleteExtraApex__ (options): returns Promise.

Compare the apex classes present in an org against a local file folder and resolve the promise after successfully removing the files (or the confirmation prompt is declined). The file name is expected to match the full name returned by the api. The option noPrompt can be set to true to remove the confirmation prompt. Without a prompt the classes are removed without confirmation.

__generateXml__ (options): returns Promise.

Compare the apex classes present in an org against a local file folder and resolve the promise with the xml content for a destructive changes xml file to remove extra classes. The file name is expected to match the full name returned by the api or it is treated as an extra class and deleted.

__Suggestions and contributions welcome__
