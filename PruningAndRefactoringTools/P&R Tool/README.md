# Pruning-and-Refactoring-Tool

Running the Pruning and Refactoring tool requires the same environment as the uml yang mapping tool, nodejs and its xmlreader module. The user can  refer to the User Guide https://github.com/OpenNetworkingFoundation/EAGLE-Open-Model-Profile-and-Tools/blob/UmlYangTools/UML-Yang%20Mapping%20Tool%20User%20Guide-v1.3_0601.docx


An introduction video on Youtube https://www.youtube.com/watch?v=6At3YFrE8Ag&feature=youtu.be. 

After the environment is configured, the user can do the following to run the tool.

Step 1: Copy the source uml model to the "project" folder.

Step 2: Change the file name of the source model to "source.uml".

Step 3: Type the following command in the project directory in terminal.

node main.js

After the user runs the tool for the first time, a target.uml file that clones the source.uml is generated in the project folder and a mapping.uml file will be generated in "/project/mapping" directory. If the target.uml is already existed before running the tool, the mapping.uml is updated according to the contents of the source model and the target model.
