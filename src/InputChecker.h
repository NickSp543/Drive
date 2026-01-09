#ifndef INPUTCHECKER_H
#define INPUTCHECKER_H

#include <string>

using namespace std;

class InputChecker {
public:
    string command;
    string filename;
    string data;

    bool isValidCommand(const string& input);
    const string& getFilename() const { return filename; }
    const string& getData() const { return data; }

private:
    bool isValidName(const string& name);
    bool isAddValid(istringstream& iss);
    bool isGetValid(istringstream& iss);
    bool isSearchValid(istringstream& iss);
    bool isDeleteValid(istringstream& iss);
};

#endif