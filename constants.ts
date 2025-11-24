
export const CPP_CODE_ADD = `#include<iostream>
#include<vector>
using namespace std;

// 高精度加法
vector<int> sum(vector<int> &A,vector<int> &B) {
    vector<int> C;
    int k=0; // 进位
    for(int i=0;i<max(A.size(),B.size());i++) {
        if(i<A.size()) k+=A[i];
        if(i<B.size()) k+=B[i];
        C.push_back(k%10); // 取当前位
        k/=10; // 计算进位
    }
    if(k) C.push_back(1); // 处理最高位可能的进位
    return C;
} 

int main() {
    string a,b;
    vector<int> A,B;
    cin>>a>>b;
    for(int i=a.size()-1;i>=0;i--) A.push_back(a[i]-'0');
    for(int i=b.size()-1;i>=0;i--) B.push_back(b[i]-'0');
    vector<int> C=sum(A,B);
    for(int i=C.size()-1;i>=0;i--) cout<<C[i];
    return 0;
}`;

export const CPP_CODE_SUB = `#include <bits/stdc++.h>
using namespace std;

vector<int> A,B;

// 比较 A >= B
bool cmp(vector<int> &A,vector<int> &B){
    if(A.size()!=B.size()) return A.size()>B.size();
    else{
        for(int i=A.size()-1;i>=0;i--){
            if(A[i]!=B[i]) return A[i]>B[i];
        }
    }
    return 1;
}

// 高精度减法 A - B (需保证 A >= B)
vector<int> sub(vector<int> &A,vector<int> &B){
    int k=0; // 借位
    vector<int> C;
    for(int i=0;i<A.size();i++){
        int t=A[i]-k;
        if(i<B.size()) t-=B[i];
        if(t<0) t+=10,k=1; // 借位
        else k=0;
        C.push_back(t);
    }
    while(C.size()>1&&C.back()==0) C.pop_back();

    return C;
}

int main(){
    string a,b;
    cin>>a>>b;
    for(int i=a.size()-1;i>=0;i--) A.push_back(a[i]-'0');
    for(int i=b.size()-1;i>=0;i--) B.push_back(b[i]-'0');
    vector<int> C;
    if(cmp(A,B)) C=sub(A,B);
    else C=sub(B,A),cout<<"-";
    for(int i=C.size()-1;i>=0;i--) cout<<C[i];
    return 0;
}`;

export const CPP_CODE_MUL = `#include<bits/stdc++.h>
using namespace std;

// 计算 A * b，A 是高精度数（低位在前），b 是普通整数
vector<int> mul(vector<int> &A,int b) {
    vector<int> C;
    int t=0; // 进位
    for(int i=0;i<A.size();i++) {
        t+=A[i]*b; // 当前位相乘加上进位
        C.push_back(t%10); // 取当前位
        t/=10; // 计算进位
    }
    while(t) { // 处理剩余的进位
        C.push_back(t%10);
        t/=10;
    }
    while(C.size()>1&&C.back()==0) C.pop_back(); // 去除前导零
    return C;
}

int main() {
    string a;
    int b;
    cin>>a>>b;
    vector<int> A;
    for(int i=a.size()-1;i>=0;i--) A.push_back(a[i]-'0');
    auto C=mul(A,b);
    for(int i=C.size()-1;i>=0;i--) cout<<C[i];
    return 0;
}`;

export const CPP_CODE_MUL_BIG = `#include<bits/stdc++.h>
using namespace std;

// 高精度 x 高精度（A,B 低位在前）
vector<int> mul(vector<int> &A, vector<int> &B) {
    vector<int> C(A.size() + B.size() + 5, 0);

    for(int i = 0; i < A.size(); i++) {
        for(int j = 0; j < B.size(); j++) {
            C[i + j] += A[i] * B[j];        // 累加
            C[i + j + 1] += C[i + j] / 10;  // 进位
            C[i + j] %= 10;                 // 当前位
        }
    }

    while(C.size() > 1 && C.back() == 0) C.pop_back(); // 去除前导零
    return C;
}

int main() {
    string a,b;
    cin>>a>>b;

    vector<int> A, B;
    for(int i = a.size() - 1; i >= 0; i--) A.push_back(a[i] - '0');
    for(int i = b.size() - 1; i >= 0; i--) B.push_back(b[i] - '0');

    auto C = mul(A, B);

    for(int i = C.size() - 1; i >= 0; i--) cout << C[i];
    return 0;
}`;

export const CPP_CODE_DIV = `#include<bits/stdc++.h>
using namespace std;

// 高精度除法：计算 A / B，返回商 C，余数存入 r
vector<int> div(vector<int> &A, int B, int &r)
{
    vector<int> C;
    for(int i=0; i<A.size(); i++)
    {
        r = r * 10 + A[i]; // 余数左移一位，加上当前位
        C.push_back(r / B); // 计算当前位的商
        r %= B; // 更新余数
    }
    reverse(C.begin(), C.end()); // 逆序存储，调整为高位在前
    while(C.size() > 1 && C.back() == 0) C.pop_back(); // 去除前导零
    return C;
}

int main()
{
    string a;
    int B, r = 0;
    cin >> a >> B;
    vector<int> A;
    for(int i=0; i<a.size(); i++) A.push_back(a[i] - '0'); // 转换为数字数组
    auto C = div(A, B, r);
    for(int i=C.size()-1; i>=0; i--) cout << C[i]; // 逆序输出商
    cout << endl << r; // 输出余数
    return 0;
}`;

export const CPP_CODE_DIV_BIG = `#include<bits/stdc++.h>
using namespace std;

// 比较: A>=B 返回 true
bool ge(vector<int> &A, vector<int> &B) {
    if(A.size() != B.size()) return A.size() > B.size();
    for(int i = 0; i < A.size(); i++)
        if(A[i] != B[i]) return A[i] > B[i];
    return true; 
}

// A -= B
void sub(vector<int> &A, vector<int> &B) {
    int t = 0;
    for(int i = A.size()-1, j = B.size()-1; i >= 0; i--, j--) {
        int b = (j >= 0 ? B[j] : 0);
        A[i] -= b + t;
        if(A[i] < 0) A[i] += 10, t = 1;
        else t = 0;
    }
    while(A.size() > 1 && A[0] == 0) A.erase(A.begin());
}

// 高精度除法 A / B
vector<int> div(vector<int> &A, vector<int> &B, vector<int> &r) {
    vector<int> C;
    r.clear();
    for(int i = 0; i < A.size(); i++) {
        r.push_back(A[i]);
        while(r.size() > 1 && r[0] == 0) r.erase(r.begin());

        int cnt = 0;
        while(r.size() >= B.size() && ge(r, B)) {
            sub(r, B);
            cnt++;
        }
        C.push_back(cnt);
    }
    while(C.size() > 1 && C[0] == 0) C.erase(C.begin());
    return C;
}

int main() {
    string a, b;
    cin >> a >> b;
    vector<int> A, B, r, C;
    for(int i = 0; i < a.size(); i++) A.push_back(a[i] - '0');
    for(int i = 0; i < b.size(); i++) B.push_back(b[i] - '0');
    C = div(A, B, r);
    for(int i = 0; i < C.size(); i++) cout << C[i];
    cout << endl;
    for(int i = 0; i < r.size(); i++) cout << r[i];
    return 0;
}`;

export const DEFAULT_NUM1 = "582";
export const DEFAULT_NUM2 = "95";
