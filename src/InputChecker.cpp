#include "InputChecker.h"
#include <sstream>
#include <map>
#include <functional>
#include <string>
#include <algorithm>

using namespace std;

// Returns true if the input is a valid command syntax
bool InputChecker::isValidCommand(const string& input) {
    istringstream iss(input);

    if (!(iss >> command)) {
        return false; // empty input
    }

    // convert command to lower case to support case insensitive commands
    std::transform(command.begin(), command.end(), command.begin(),
                    [](unsigned char c){ return std::tolower(c); });

    map<string, function<bool(istringstream&)>> validators = {
        {"post",    [this](istringstream& s){ return this->isAddValid(s); }},
        {"get",    [this](istringstream& s){ return this->isGetValid(s); }},
        {"search", [this](istringstream& s){ return this->isSearchValid(s); }},
        {"delete", [this](istringstream& s){ return this->isDeleteValid(s); }}
    };

    if (validators.count(command) == 0) return false; // check if the command exists in the map

    return validators[command](iss); // call for the function corresponding to the command
}

// Returns true if the given filename is valid
bool InputChecker::isValidName(const string& name) {
    for (char c : name) {
        if (c == ' ') return false;
    }
    return true;
}

// Returns true if the "post" command arguments are valid
bool InputChecker::isAddValid(istringstream& iss) {
    if (!(iss >> filename)) return false; // no filename
    if (!(isValidName(filename))) return false; // filename isn't valid
    getline(iss, data);
    size_t start = data.find_first_not_of(" \t");
    if (start == string::npos) return false; // no data to compress
    data = data.substr(start);

    // Unescape the data (reverse of Express server escaping)
    string unescaped;
    for (size_t i = 0; i < data.size(); ++i) {
        if (data[i] == '\\' && i + 1 < data.size()) {
            char next = data[i + 1];
            if (next == 'n') {
                unescaped += '\n';
                ++i;
            } else if (next == 'r') {
                unescaped += '\r';
                ++i;
            } else if (next == '\\') {
                unescaped += '\\';
                ++i;
            } else {
                unescaped += data[i];
            }
        } else {
            unescaped += data[i];
        }
    }
    data = unescaped;

    return true;
}

// Returns true if the "get" command arguments are valid
bool InputChecker::isGetValid(istringstream& iss) {
    if (!(iss >> filename)) return false; // no filename
    string extra;
    if (iss >> extra) return false; // extra arguments
    return isValidName(filename);
}

// Returns true if the "search" command arguments are valid
bool InputChecker::isSearchValid(istringstream& iss) {
    if (!(iss >> data)) return false; // no string to search
    string extra;
    if (iss >> extra) return false; // extra arguments
    return true;
}

// Returns true if the "delete" command arguments are valid
bool InputChecker::isDeleteValid(istringstream& iss) {
    if (!(iss >> filename)) return false; // missing filename
    string extra;
    if (iss >> extra) return false; // extra arguments
    return true;
}